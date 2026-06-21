# G4 Delivery Backend

Node.js + Express + PostgreSQL REST API for the G4 Delivery Admin Dashboard.

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/g4delivery
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Create the PostgreSQL database

```sql
CREATE DATABASE g4delivery;
```

Or via psql:

```bash
psql -U postgres -c "CREATE DATABASE g4delivery;"
```

### 4. Run migrations

```bash
npm run migrate
```

This creates all tables and seeds the default admin account.

### 5. Start the server

Development (with auto-reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

Server starts on `http://localhost:5000`

---

## Default Admin Credentials

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@g4delivery.com   |
| Password | admin123               |
| Role     | superadmin             |

> **Change this password immediately after first login.**

---

## API Endpoints

All endpoints (except `/api/auth/login`) require a Bearer token:

```
Authorization: Bearer <token>
```

### Auth

| Method | Path                        | Description             |
|--------|-----------------------------|-------------------------|
| POST   | /api/auth/login             | Login, get JWT token    |
| GET    | /api/auth/me                | Get current admin info  |
| PUT    | /api/auth/change-password   | Change password         |

### Dashboard

| Method | Path                        | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | /api/dashboard/stats        | Summary cards (orders, riders, rev)  |
| GET    | /api/dashboard/activity     | Recent 10 delivery activity items    |
| GET    | /api/dashboard/chart        | Daily orders + monthly revenue       |
| GET    | /api/dashboard/quick-stats  | Today's orders, avg time, etc.       |

### Customers

| Method | Path                        | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | /api/customers              | List all (search, status, page)      |
| GET    | /api/customers/:id          | Get single customer                  |
| POST   | /api/customers              | Create customer                      |
| PUT    | /api/customers/:id          | Update customer                      |
| DELETE | /api/customers/:id          | Delete customer                      |
| PATCH  | /api/customers/:id/status   | Toggle Active/Inactive or set Banned |

**Query params:** `?search=&status=Active&page=1&limit=20`

### Riders

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | /api/riders                 | List all (search, status, page)|
| GET    | /api/riders/:id             | Get single rider               |
| POST   | /api/riders                 | Create rider                   |
| PUT    | /api/riders/:id             | Update rider                   |
| DELETE | /api/riders/:id             | Soft delete rider              |
| PATCH  | /api/riders/:id/status      | Toggle status                  |
| PATCH  | /api/riders/:id/location    | Update GPS location            |

**Body for location:** `{ "lat": 9.0320, "lng": 38.7469 }`

### Deliveries

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | /api/deliveries             | List all (search, status, page)|
| GET    | /api/deliveries/:id         | Get delivery + status history  |
| POST   | /api/deliveries             | Create new delivery            |
| PATCH  | /api/deliveries/:id/status  | Update delivery status         |
| PATCH  | /api/deliveries/:id/assign  | Assign rider to delivery       |

**Status values:** `Pending` | `Accepted` | `Picked Up` | `In Transit` | `Delivered` | `Failed` | `Cancelled`

### Stores

| Method | Path                              | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/stores                       | List stores              |
| GET    | /api/stores/:id                   | Get store                |
| POST   | /api/stores                       | Create store             |
| PUT    | /api/stores/:id                   | Update store             |
| DELETE | /api/stores/:id                   | Soft delete store        |
| GET    | /api/stores/:id/products          | List store products      |
| POST   | /api/stores/:id/products          | Add product to store     |
| PUT    | /api/stores/:id/products/:pid     | Update product           |
| DELETE | /api/stores/:id/products/:pid     | Delete product           |
| GET    | /api/stores/:id/categories        | List categories          |
| POST   | /api/stores/:id/categories        | Create category          |
| DELETE | /api/stores/:id/categories/:cid   | Delete category          |

### Reports

| Method | Path                            | Description                      |
|--------|---------------------------------|----------------------------------|
| GET    | /api/reports/trends             | 7-day delivery trends            |
| GET    | /api/reports/peak-hours         | Deliveries by hour (last 30 days)|
| GET    | /api/reports/rider-performance  | Per-rider stats                  |
| GET    | /api/reports/summary            | Header cards (?from=&to=)        |

### Pricing

| Method | Path          | Description           |
|--------|---------------|-----------------------|
| GET    | /api/pricing  | Get pricing config    |
| PUT    | /api/pricing  | Update pricing config |

### Settings

| Method | Path           | Description        |
|--------|----------------|--------------------|
| GET    | /api/settings  | Get app settings   |
| PUT    | /api/settings  | Update settings    |

### Live Tracking

| Method | Path                     | Description                       |
|--------|--------------------------|-----------------------------------|
| GET    | /api/tracking/riders     | All online/busy riders + GPS      |
| GET    | /api/tracking/riders/:id | Single rider location             |

### Health Check

| Method | Path         | Description      |
|--------|--------------|------------------|
| GET    | /api/health  | Server liveness  |

---

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Paginated list:**
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

**Error:**
```json
{
  "success": false,
  "error": "Message describing what went wrong"
}
```

---

## Project Structure

```
backend/
├── server.js                        # Entry point
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── config/
    │   └── db.js                    # PostgreSQL pool + query helper
    ├── db/
    │   ├── migrate.js               # Migration runner
    │   └── migrations/
    │       ├── 001_admins.sql
    │       ├── 002_customers.sql
    │       ├── 003_riders.sql
    │       ├── 004_stores.sql
    │       ├── 005_deliveries.sql
    │       ├── 006_pricing.sql
    │       └── 007_settings.sql
    ├── middleware/
    │   ├── auth.js                  # JWT verification
    │   ├── roles.js                 # Role-based access
    │   ├── errorHandler.js          # Global error handler
    │   └── validate.js              # express-validator checker
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── dashboard.controller.js
    │   ├── customers.controller.js
    │   ├── riders.controller.js
    │   ├── deliveries.controller.js
    │   ├── stores.controller.js
    │   ├── reports.controller.js
    │   ├── pricing.controller.js
    │   ├── settings.controller.js
    │   └── tracking.controller.js
    └── routes/
        ├── auth.routes.js
        ├── dashboard.routes.js
        ├── customers.routes.js
        ├── riders.routes.js
        ├── deliveries.routes.js
        ├── stores.routes.js
        ├── reports.routes.js
        ├── pricing.routes.js
        ├── settings.routes.js
        └── tracking.routes.js
```
