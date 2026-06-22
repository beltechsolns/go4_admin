# G4 Delivery Admin

Full-stack admin panel for managing a delivery platform in Shakiso, Ethiopia.

## Tech Stack

**Frontend:** React 19, Vite 8, Tailwind CSS 4, React Router 7, Leaflet, Lucide Icons

**Backend:** Express.js, PostgreSQL, JWT Auth, bcrypt

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 2. Configure environment
# Edit backend/.env with your database credentials
# Default: postgres:yuti@localhost:5432/g4delivery

# 3. Create database
psql -U postgres -c "CREATE DATABASE g4delivery"

# 4. Run migrations & seed
cd backend
npm run migrate
npm run seed

# 5. Start both servers
# Terminal 1 - Backend (port 5000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

### Login

Open http://localhost:5173

**Email:** admin@g4delivery.com
**Password:** admin123

## Project Structure

```
g4-delivery-web-admin/
├── frontend/               # React SPA
│   └── src/
│       ├── api/            # Axios client
│       ├── components/     # Shared UI components
│       ├── features/       # Feature modules
│       ├── hooks/          # Custom React hooks
│       └── pages/          # Page components
├── backend/                # Express API
│   └── src/
│       ├── config/         # DB connection
│       ├── controllers/    # Route handlers
│       ├── db/             # Migrations & seed
│       ├── middleware/     # Auth, validation
│       └── routes/         # API routes
└── README.md
```

## API Endpoints

| Prefix | Description |
|---|---|
| `/api/auth` | Login, profile, change password |
| `/api/dashboard` | Stats, charts, activity |
| `/api/customers` | Customer CRUD |
| `/api/riders` | Rider CRUD + location |
| `/api/deliveries` | Delivery CRUD + assignments |
| `/api/stores` | Store CRUD + products + categories |
| `/api/reports` | Trends, peak hours, performance |
| `/api/pricing` | Pricing configuration |
| `/api/settings` | App settings |
| `/api/tracking` | Live rider tracking |
