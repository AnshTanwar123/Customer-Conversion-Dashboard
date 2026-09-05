const vintageOptions = ['0-6M', '6-12M', '1-2Y', '2-5Y', '5Y+'];
const propensityOptions = ['Low', 'Medium', 'High', 'Very High'];
const cardLogoOptions = ['Visa', 'Mastercard', 'Amex', 'RuPay'];
const sourceOptions = ['WhatsApp', 'SMS', 'Email', 'IVR'];

const funnelTargets = [
  { channel: 'Email', sent: 3800, delivered: 3420, landed: 342, booked: 86 },
  { channel: 'IVR', sent: 3800, delivered: 3420, landed: 342, booked: 86 },
  { channel: 'WhatsApp', sent: 3800, delivered: 3420, landed: 342, booked: 85 },
  { channel: 'SMS', sent: 3800, delivered: 3420, landed: 342, booked: 85 },
];

const seededRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const getIncreasedLimitBracket = (value) => {
  if (value <= 20000) return '0-20k';
  if (value <= 50000) return '20k-50k';
  if (value <= 100000) return '50k-1L';
  if (value <= 200000) return '1L-2L';
  if (value <= 300000) return '2L-3L';
  return '3L+';
};

const getLoanAmount = (channel, bookedIndex) => {
  const baseByChannel = {
    Email: 120000,
    IVR: 130000,
    WhatsApp: 110000,
    SMS: 98000,
  };

  const multiplier = 0.8 + ((bookedIndex % 7) / 10);
  return Number((baseByChannel[channel] * multiplier).toFixed(2));
};

export const generateDashboardData = () => {
  const rand = seededRandom(42);
  const fileAlloc = [];
  const landTable = [];
  const bookingTable = [];

  let customerCounter = 1;

  funnelTargets.forEach((target) => {
    for (let index = 0; index < target.sent; index += 1) {
      const customerId = `CUST${String(customerCounter).padStart(6, '0')}`;
      const delivered = index < target.delivered;
      const landed = delivered && index < target.landed;
      const booked = landed && index < target.booked;
      const loanAmount = booked ? getLoanAmount(target.channel, index) : 0;

      const customerRecord = {
        customer_id: customerId,
        vintage: vintageOptions[Math.floor(rand() * vintageOptions.length)],
        credit_limit: 30000 + Math.round(rand() * 260000),
        increased_credit_limit: Math.round((30000 + Math.round(rand() * 260000)) * (0.2 + rand() * 0.7)),
        increased_limit_bracket: getIncreasedLimitBracket(Math.round((30000 + Math.round(rand() * 260000)) * (0.2 + rand() * 0.7))),
        ELA: rand() < 0.65 ? 'Yes' : 'No',
        Propensity: propensityOptions[Math.floor(rand() * propensityOptions.length)],
        card_logo: cardLogoOptions[Math.floor(rand() * cardLogoOptions.length)],
        campaign_sent: 1,
        campaign_delivered: delivered ? 1 : 0,
        landed,
        source: target.channel,
        booked,
        loan_amount: loanAmount,
      };

      fileAlloc.push(customerRecord);

      if (landed) {
        landTable.push({ customer_id: customerId, source: target.channel });
      }

      if (booked) {
        bookingTable.push({ customer_id: customerId, loan_amount: loanAmount });
      }

      customerCounter += 1;
    }
  });

  const totalSent = funnelTargets.reduce((sum, item) => sum + item.sent, 0);
  const totalDelivered = funnelTargets.reduce((sum, item) => sum + item.delivered, 0);
  const totalLanded = funnelTargets.reduce((sum, item) => sum + item.landed, 0);
  const totalBooked = funnelTargets.reduce((sum, item) => sum + item.booked, 0);

  while (fileAlloc.length < 16000) {
    const customerId = `CUST${String(customerCounter).padStart(6, '0')}`;
    const creditLimit = 22000 + Math.round(rand() * 210000);
    const increasedCreditLimit = Math.round(creditLimit * (0.15 + rand() * 0.7));

    fileAlloc.push({
      customer_id: customerId,
      vintage: vintageOptions[Math.floor(rand() * vintageOptions.length)],
      credit_limit: creditLimit,
      increased_credit_limit: increasedCreditLimit,
      increased_limit_bracket: getIncreasedLimitBracket(increasedCreditLimit),
      ELA: rand() < 0.5 ? 'Yes' : 'No',
      Propensity: propensityOptions[Math.floor(rand() * propensityOptions.length)],
      card_logo: cardLogoOptions[Math.floor(rand() * cardLogoOptions.length)],
      campaign_sent: 0,
      campaign_delivered: 0,
      landed: false,
      source: null,
      booked: false,
      loan_amount: 0,
    });

    customerCounter += 1;
  }

  return {
    file_alloc: fileAlloc,
    land_table: landTable,
    booking_table: bookingTable,
    summary: {
      total_customers: 16000,
      sent: totalSent,
      delivered: totalDelivered,
      landed: totalLanded,
      booked: totalBooked,
    },
  };
};

export const dashboardData = generateDashboardData();
