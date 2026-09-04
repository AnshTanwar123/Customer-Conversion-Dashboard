import { useState } from 'react';
import { dashboardData } from './data/mockData';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Math.round(value));
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const calculateSummary = (customers) => {
  const totalCustomers = customers.length;
  const sent = customers.filter((customer) => customer.campaign_sent === 1).length;
  const delivered = customers.filter((customer) => customer.campaign_delivered === 1).length;
  const landed = dashboardData.land_table.length;
  const booked = dashboardData.booking_table.length;
  const loanAmount = dashboardData.booking_table.reduce((sum, row) => sum + row.loan_amount, 0);

  return {
    totalCustomers,
    sent,
    delivered,
    landed,
    booked,
    loanAmount,
    deliveryRate: sent ? (delivered / sent) * 100 : 0,
    landRate: delivered ? (landed / delivered) * 100 : 0,
    bookingRate: landed ? (booked / landed) * 100 : 0,
    conversionRate: totalCustomers ? (booked / totalCustomers) * 100 : 0,
    avgBookingValue: booked ? loanAmount / booked : 0,
  };
};

const buildMetricTable = (rows, metricKey, title, formatter = (value) => value) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = row[metricKey];
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: key,
        customers: 0,
        sent: 0,
        delivered: 0,
        landed: 0,
        booked: 0,
        loanAmount: 0,
      });
    }

    const bucket = grouped.get(key);
    bucket.customers += 1;
    bucket.sent += row.campaign_sent === 1 ? 1 : 0;
    bucket.delivered += row.campaign_delivered === 1 ? 1 : 0;
    bucket.landed += row.landed === true ? 1 : 0;
    bucket.booked += row.booked === true ? 1 : 0;
    bucket.loanAmount += row.loan_amount || 0;
  });

  return {
    title,
    rows: [...grouped.values()]
      .map((item) => ({
        ...item,
        deliveryRate: item.sent ? (item.delivered / item.sent) * 100 : 0,
        landRate: item.delivered ? (item.landed / item.delivered) * 100 : 0,
        bookingRate: item.landed ? (item.booked / item.landed) * 100 : 0,
        conversionRate: item.customers ? (item.booked / item.customers) * 100 : 0,
        label: formatter(item.name),
      }))
      .sort((a, b) => b.booked - a.booked),
  };
};

const sourceBreakdown = () => {
  const map = new Map();

  dashboardData.land_table.forEach((row) => {
    if (!map.has(row.source)) {
      map.set(row.source, { source: row.source, landed: 0 });
    }
    map.get(row.source).landed += 1;
  });

  return [...map.values()].map((item) => ({
    ...item,
    share: (item.landed / dashboardData.land_table.length) * 100,
  }));
};

const channelPerformance = () => {
  const stats = new Map();

  dashboardData.file_alloc.forEach((customer) => {
    if (!customer.source || customer.campaign_sent !== 1) return;

    if (!stats.has(customer.source)) {
      stats.set(customer.source, {
        channel: customer.source,
        sent: 0,
        delivered: 0,
        landed: 0,
        booked: 0,
        loanAmount: 0,
      });
    }

    const entry = stats.get(customer.source);
    entry.sent += 1;
    entry.delivered += customer.campaign_delivered === 1 ? 1 : 0;
    entry.landed += customer.landed === true ? 1 : 0;
    entry.booked += customer.booked === true ? 1 : 0;
    entry.loanAmount += customer.loan_amount || 0;
  });

  return [...stats.values()]
    .map((item) => ({
      ...item,
      deliveryRate: item.sent ? (item.delivered / item.sent) * 100 : 0,
      landRate: item.delivered ? (item.landed / item.delivered) * 100 : 0,
      bookingRate: item.landed ? (item.booked / item.landed) * 100 : 0,
      conversionRate: item.sent ? (item.booked / item.sent) * 100 : 0,
    }))
    .sort((a, b) => b.booked - a.booked);
};

const segmentGroups = [
  buildMetricTable(dashboardData.file_alloc, 'vintage', 'Vintage wise performance', (value) => value),
  buildMetricTable(dashboardData.file_alloc, 'Propensity', 'Propensity wise performance', (value) => value),
  buildMetricTable(dashboardData.file_alloc, 'card_logo', 'Card logo wise performance', (value) => value),
  buildMetricTable(dashboardData.file_alloc, 'increased_limit_bracket', 'Increased limit bracket wise performance', (value) => value),
];

const menuItems = ['Overview', 'Audience', 'Campaigns', 'Conversions', 'Exports'];

const getTabTitle = (tab) => {
  const titles = {
    Overview: 'Advanced analytics overview',
    Audience: 'Audience performance',
    Campaigns: 'Campaign effectiveness',
    Conversions: 'Conversion performance',
    Exports: 'Export and reporting',
  };

  return titles[tab] || 'Dashboard';
};

function ConversionChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="chart-area">
      {data.map((item) => (
        <div className="chart-row" key={item.label}>
          <div className="chart-label-group">
            <span>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </div>
          <div className="chart-track">
            <div
              className="chart-bar"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const summary = calculateSummary(dashboardData.file_alloc);
  const sourceRows = sourceBreakdown();
  const channelRows = channelPerformance();
  const vintageCounts = dashboardData.file_alloc.reduce((acc, item) => {
    acc[item.vintage] = (acc[item.vintage] || 0) + 1;
    return acc;
  }, {});
  const topVintage = Object.entries(vintageCounts).sort((a, b) => b[1] - a[1])[0];

  const scoreCards = [
    { label: 'Customers', value: summary.totalCustomers, delta: '+12.4%', tone: 'blue' },
    { label: 'Campaign Sent', value: summary.sent, delta: '+8.1%', tone: 'purple' },
    { label: 'Campaign Delivered', value: summary.delivered, delta: '+7.6%', tone: 'green' },
    { label: 'Landed', value: summary.landed, delta: '+5.9%', tone: 'amber' },
    { label: 'Booked', value: summary.booked, delta: '+3.7%', tone: 'pink' },
    { label: 'Loan Amount', value: formatCurrency(summary.loanAmount), delta: '+18.2%', tone: 'teal' },
  ];

  const funnelSteps = [
    { label: 'Customers', value: summary.totalCustomers },
    { label: 'Sent', value: summary.sent, rate: summary.sent ? (summary.sent / summary.totalCustomers) * 100 : 0 },
    { label: 'Delivered', value: summary.delivered, rate: summary.deliveryRate },
    { label: 'Landed', value: summary.landed, rate: summary.landRate },
    { label: 'Booked', value: summary.booked, rate: summary.bookingRate },
  ];

  const conversionChartData = [
    { label: 'Sent', value: summary.sent },
    { label: 'Delivered', value: summary.delivered },
    { label: 'Landed', value: summary.landed },
    { label: 'Booked', value: summary.booked },
  ];

  const renderOverview = () => (
    <>
      <section className="score-grid">
        {scoreCards.map((item) => (
          <div className={`score-card ${item.tone}`} key={item.label}>
            <div className="score-head">
              <span>{item.label}</span>
              <span className="delta">{item.delta}</span>
            </div>
            <div className="value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel large-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Funnel</p>
              <h3>Campaign journey</h3>
            </div>
            <span className="badge">Overall conversion {summary.conversionRate.toFixed(2)}%</span>
          </div>

          <div className="funnel-list">
            {funnelSteps.map((step) => (
              <div className="funnel-item" key={step.label}>
                <div className="funnel-label-wrap">
                  <span>{step.label}</span>
                  <strong>{formatNumber(step.value)}</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${Math.min(step.rate || 100, 100)}%` }} />
                </div>
                <small>{step.rate ? `${step.rate.toFixed(1)}%` : '—'}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Source mix</p>
              <h3>Landed by channel</h3>
            </div>
          </div>

          <div className="source-list">
            {sourceRows.map((source) => (
              <div className="source-item" key={source.source}>
                <div className="source-meta">
                  <span>{source.source}</span>
                  <strong>{source.landed}</strong>
                </div>
                <div className="progress-track small">
                  <div className="progress-bar source" style={{ width: `${source.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="segment-grid">
        {segmentGroups.map((group) => (
          <div className="panel segment-panel" key={group.title}>
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Metrics</p>
                <h3>{group.title}</h3>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Bucket</th>
                  <th>Cust</th>
                  <th>Sent</th>
                  <th>Del</th>
                  <th>Land</th>
                  <th>Book</th>
                  <th>Conv%</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.slice(0, 5).map((row) => (
                  <tr key={`${group.title}-${row.name}`}>
                    <td>{row.label}</td>
                    <td>{formatNumber(row.customers)}</td>
                    <td>{formatNumber(row.sent)}</td>
                    <td>{formatNumber(row.delivered)}</td>
                    <td>{formatNumber(row.landed)}</td>
                    <td>{formatNumber(row.booked)}</td>
                    <td>{row.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </>
  );

  const renderAudience = () => (
    <div className="tab-section">
      <div className="info-grid">
        <div className="info-card">
          <span>High propensity audience</span>
          <strong>{formatNumber(dashboardData.file_alloc.filter((row) => row.Propensity === 'Very High').length)}</strong>
        </div>
        <div className="info-card">
          <span>Top vintage segment</span>
          <strong>
            {topVintage ? `${topVintage[0]} (${formatNumber(topVintage[1])})` : 'N/A'}
          </strong>
        </div>
        <div className="info-card">
          <span>ELA active customers</span>
          <strong>{formatNumber(dashboardData.file_alloc.filter((row) => row.ELA === 'Yes').length)}</strong>
        </div>
        <div className="info-card">
          <span>Avg credit limit</span>
          <strong>{formatCurrency(dashboardData.file_alloc.reduce((sum, row) => sum + row.credit_limit, 0) / dashboardData.file_alloc.length)}</strong>
        </div>
      </div>

      <div className="segment-grid">
        {segmentGroups.map((group) => (
          <div className="panel segment-panel" key={group.title}>
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Audience</p>
                <h3>{group.title}</h3>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Bucket</th>
                  <th>Count</th>
                  <th>Booked</th>
                  <th>Conv%</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.slice(0, 6).map((row) => (
                  <tr key={`${group.title}-aud-${row.name}`}>
                    <td>{row.label}</td>
                    <td>{formatNumber(row.customers)}</td>
                    <td>{formatNumber(row.booked)}</td>
                    <td>{row.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="tab-section">
      <div className="info-grid three-col">
        <div className="info-card">
          <span>Campaign sent</span>
          <strong>{formatNumber(summary.sent)}</strong>
        </div>
        <div className="info-card">
          <span>Campaign delivered</span>
          <strong>{formatNumber(summary.delivered)}</strong>
        </div>
        <div className="info-card">
          <span>Delivery rate</span>
          <strong>{summary.deliveryRate.toFixed(1)}%</strong>
        </div>
      </div>

      <div className="panel segment-panel">
        <div className="panel-header compact">
          <div>
            <p className="eyebrow">Campaign</p>
            <h3>Channel-wise performance</h3>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Sent</th>
              <th>Delivered</th>
              <th>Landed</th>
              <th>Booked</th>
              <th>Delivery %</th>
              <th>Landed %</th>
              <th>Booked %</th>
            </tr>
          </thead>
          <tbody>
            {channelRows.map((row) => (
              <tr key={`channel-table-${row.channel}`}>
                <td>{row.channel}</td>
                <td>{formatNumber(row.sent)}</td>
                <td>{formatNumber(row.delivered)}</td>
                <td>{formatNumber(row.landed)}</td>
                <td>{formatNumber(row.booked)}</td>
                <td>{row.deliveryRate.toFixed(1)}%</td>
                <td>{row.landRate.toFixed(1)}%</td>
                <td>{row.bookingRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConversions = () => (
    <div className="tab-section">
      <div className="info-grid four-col">
        <div className="info-card">
          <span>Landing rate</span>
          <strong>{summary.landRate.toFixed(1)}%</strong>
        </div>
        <div className="info-card">
          <span>Booking rate</span>
          <strong>{summary.bookingRate.toFixed(1)}%</strong>
        </div>
        <div className="info-card">
          <span>Conversion rate</span>
          <strong>{summary.conversionRate.toFixed(2)}%</strong>
        </div>
        <div className="info-card">
          <span>Avg booking value</span>
          <strong>{formatCurrency(summary.avgBookingValue)}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Performance</p>
            <h3>Conversion performance</h3>
          </div>
          <span className="badge">Funnel quality {summary.bookingRate.toFixed(1)}%</span>
        </div>
        <ConversionChart data={conversionChartData} />
      </div>
    </div>
  );

  const renderExports = () => (
    <div className="tab-section">
      <div className="export-grid">
        <div className="export-card">
          <span className="export-tag success">Ready</span>
          <h4>Customer Funnel Summary</h4>
          <p>{formatNumber(summary.totalCustomers)} customers • {formatNumber(summary.booked)} bookings</p>
        </div>
        <div className="export-card">
          <span className="export-tag warning">Queued</span>
          <h4>Audience Segmentation</h4>
          <p>Vintage, propensity, card logo, limit-bracket views</p>
        </div>
        <div className="export-card">
          <span className="export-tag neutral">Draft</span>
          <h4>Campaign Insights</h4>
          <p>Delivery, channel mix, funnel conversion report</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return renderOverview();
      case 'Audience':
        return renderAudience();
      case 'Campaigns':
        return renderCampaigns();
      case 'Conversions':
        return renderConversions();
      case 'Exports':
        return renderExports();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon">DC</div>
          <div>
            <p className="eyebrow">Portfolio Project</p>
            <h1>DataCore</h1>
          </div>
        </div>

        <nav className="side-menu">
          {menuItems.map((item) => (
            <button
              key={item}
              className={`menu-item ${activeTab === item ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mini-panel">
          <p className="panel-label">Portfolio note</p>
          <h3>Customer funnel</h3>
          <p>
            Designed for banking conversion analysis across vintage, propensity, card and credit-limit segments.
          </p>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Customer Conversion Dashboard</p>
            <h2>{getTabTitle(activeTab)}</h2>
          </div>
          <div className="actions">
            <button className="ghost-button">Download report</button>
            <button className="primary-button">Export CSV</button>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

export default App;
