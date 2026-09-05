# Customer Conversion Dashboard

A React dashboard for customer funnel analytics, built around a synthetic 16k-row dataset that mirrors the structure of:

## Live Demo

[Open the Customer Conversion Dashboard](https://customer-conversion-dashboard.vercel.app/)

- `file_alloc` table: customer-level campaign allocation data
- `land_table`: customers who landed via WhatsApp / SMS / Email / IVR
- `booking_table`: customers with booked loans and booking amounts

## Dashboard views

- KPI summary cards
- Funnel overview from sent -> delivered -> landed -> booked
- Segmentation by vintage, propensity, card logo, and increased credit limit bracket
- Channel/source breakdown for landed customers

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite app in the browser (typically http://localhost:5173).
