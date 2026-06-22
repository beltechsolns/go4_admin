# G4 Delivery Admin — Frontend

React-based admin dashboard for managing deliveries, customers, riders, stores, and analytics.

## Scripts

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Features

- **Dashboard** — Real-time stats, daily orders, revenue, delivery trends, peak hours, top performers
- **Customers** — CRUD, search, filter, status toggle
- **Riders** — CRUD, search, filter, status toggle, GPS tracking
- **Deliveries** — List, search, filter, assign riders, status updates
- **Stores** — Card grid, detail view with products & categories
- **Live Tracking** — Real-time rider positions on Leaflet map (polls every 10s)
- **Reports** — Delivery trends, peak hours analysis, orders by category, rider performance
- **Pricing** — Configure base fee, per-km rate, surcharges
- **Settings** — App name, support info, notification toggles, language

## Tech

React 19, Vite 8, Tailwind CSS 4, React Router 7, Leaflet, Axios, Lucide Icons

## API

All data is fetched from the backend at `http://localhost:5000/api`. The Axios client automatically attaches the JWT token from localStorage.

## Auth

Login is required. Unauthenticated users are redirected to `/login`. Token is stored in localStorage and cleared on logout.
