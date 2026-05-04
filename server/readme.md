# 🚚 Supply Tracker — Server

Backend for **Supply Tracker**, a multi-tenant live logistics platform built with Node.js, Express, MongoDB, Redis, and Socket.IO.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Real-time | Socket.IO |
| Auth | JWT (httpOnly cookie) |
| Email | Resend |
| Logging | Winston |
| Maps / ETA | Mapbox Directions API |

---

## Project Structure

```
server/
├── config/
│   ├── db.config.js          # MongoDB connection + index creation
│   └── redis.config.js       # ioredis client + cache helpers
├── controllers/
│   ├── auth.Controller.js
│   ├── admin.Controller.js
│   ├── driver.Controller.js
│   ├── shipment.Controller.js
│   ├── tracking.Controller.js
│   ├── analytics.Controller.js
│   ├── organization.Controller.js
│   ├── invite.Controller.js
│   ├── notification.Controller.js
│   ├── support.Controller.js
│   └── task.Controller.js
├── middleware/
│   ├── auth.middleware.js     # protect / admin / driver guards
│   ├── tenant.middleware.js   # injects req.organizationId
│   ├── rateLimiter.middleware.js
│   ├── validation.middleware.js
│   └── errorHandle.middleware.js
├── models/
│   ├── user.models.js
│   ├── Organization.models.js
│   ├── Shipment.models.js
│   ├── Task.models.js
│   ├── Invite.models.js
│   ├── Notification.models.js
│   └── SupportTicket.models.js
├── routes/
│   ├── auth.routes.js
│   ├── admin.routes.js
│   ├── driver.routes.js
│   ├── shipments.routes.js
│   ├── tracking.routes.js
│   ├── analytics.routes.js
│   ├── organization.routes.js
│   ├── invite.route.js
│   ├── notification.routes.js
│   ├── support.routes.js
│   ├── taskRoutes.routes.js
│   └── ai.routes.js
├── services/
│   ├── shipment.service.js
│   ├── aiIntegration.service.js   # Mapbox Directions + ETA calculation
│   └── notification.service.js    # Socket.IO real-time notifications
├── utils/
│   ├── asyncHandle.utils.js
│   ├── logger.utils.js
│   └── email.utils.js             # Resend — OTP, reset, invite emails
└── index.js                       # App entry point
```

---

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local Docker or cloud)
- Mapbox account (for road distance / ETA)
- Resend account (for transactional email)

---

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/supplyTracker

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Client URL (for CORS + reset-password links)
CLIENT_URL=http://localhost:5173

# Mapbox
MAPBOX_TOKEN=pk.your_mapbox_token_here

# Resend email
RESEND_API_KEY=re_your_resend_key
RESEND_FROM=Supply Tracker <noreply@yourdomain.com>

# Rate limiting (optional, defaults shown)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Installation & Running

```bash
# Install dependencies
npm install

# Development (with nodemon)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`.

---

## Redis Setup (Docker)

```bash
docker run -d --name redis-cache -p 6379:6379 redis:7

# Verify
docker exec -it redis-cache redis-cli ping
# → PONG
```

---

## Authentication & Multi-Tenancy

Every request passes through three middleware layers in sequence:

1. **`protect`** — verifies JWT from `httpOnly` cookie or `Authorization: Bearer` header, attaches `req.user`
2. **`attachTenant`** — reads `req.user.organizationId`, attaches `req.organizationId`; all DB queries are scoped to this value
3. **Role guard** (`admin` / `driver`) — checks `req.user.role`

User roles: `admin` · `driver` · `user`

Email verification is required before any protected route can be accessed (enforced on the client; OTP flow on the server).

---

## API Routes

### Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a plain user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset link |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/track/:trackingNumber` | Public shipment tracking |
| POST | `/api/organizations/register` | Register a new shop + admin |
| GET | `/api/invites/:token/validate` | Validate an invite link |
| POST | `/api/invites/:token/accept` | Accept invite, create account |

### Private — Auth
| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/verify-email` | Verify OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/preferences` | Update theme/notifications |
| POST | `/api/auth/logout` | Logout |

### Private — Admin
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | List org users (non-admin) |
| POST | `/api/admin/users/:id/promote-driver` | Promote user to driver |
| POST | `/api/admin/users/:id/demote-driver` | Demote driver to user |
| PATCH | `/api/admin/users/:id/toggle` | Toggle user active status |
| GET | `/api/admin/drivers` | List org drivers |
| PUT | `/api/admin/drivers/:id` | Update driver details |
| POST | `/api/admin/shipments/:id/assign` | Assign driver to shipment |

### Private — Shipments
| Method | Path | Description |
|---|---|---|
| GET | `/api/shipments` | List shipments (role-scoped) |
| POST | `/api/shipments` | Create shipment (admin only) |
| GET | `/api/shipments/:id` | Get single shipment |
| PUT | `/api/shipments/:id` | Update shipment |
| DELETE | `/api/shipments/:id` | Delete shipment |

### Private — Driver
| Method | Path | Description |
|---|---|---|
| GET | `/api/driver/shipments` | Get assigned shipments |
| PUT | `/api/driver/shipments/:id/status` | Update shipment status |
| POST | `/api/driver/location` | Update live GPS location (HTTP) |
| PUT | `/api/driver/shipments/:id/notes` | Add driver notes |

### Private — Analytics, Notifications, Support, Invites
All scoped to the authenticated user's organization. See individual route files for full details.

### AI / ETA
| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/preview-eta` | Preview ETA before creating shipment |

ETA is calculated using **Mapbox Directions API** for real road distance + duration. If Mapbox is unavailable, the service falls back to the Haversine formula.

---

## Real-time (Socket.IO)

On connection, authenticated users are automatically joined to a private room `user_<id>` for targeted notifications.

| Event (client → server) | Description |
|---|---|
| `join_shipment` | Subscribe to a shipment's live updates |
| `leave_shipment` | Unsubscribe |
| `driver_location_update` | Driver emits GPS coords (authenticated) |

| Event (server → client) | Description |
|---|---|
| `location_updated` | New driver GPS position |
| `status_updated` | Shipment status changed |
| `eta_updated` | Recalculated ETA after location update |
| `notification` | Real-time in-app notification |
| `driver_location_ack` | Confirms location was saved, returns new ETA |
| `driver_location_error` | Error during location update |

---

## Caching Strategy

Redis cache-aside pattern with the following TTLs:

| Cache Key Pattern | TTL | Invalidated On |
|---|---|---|
| `shipments:*` | 5 min | Any shipment create/update/delete/assign |
| `track:<trackingNumber>` | 30 sec | Status or location update |
| `analytics:overview:<orgId>` | 5 min | — (time-based expiry) |
| `analytics:per-day:<orgId>` | 5 min | — |

---

## Email (Resend)

Three transactional email types are sent via the Resend API:

- **OTP verification** — sent on register and resend-OTP
- **Password reset** — 30-minute expiry link
- **Invite** — sent when admin creates a targeted invite

All emails use a shared HTML wrapper with the Supply Tracker branding.

---

## Error Handling

A global `errorHandler` middleware catches all thrown errors and maps them to appropriate HTTP responses:

- Mongoose `ValidationError` → 400
- Duplicate key (`code 11000`) → 400
- `CastError` (bad ObjectId) → 400
- `JsonWebTokenError` / `TokenExpiredError` → 401
- Unhandled → 500 (stack trace included in development)

---

## Health Check

```
GET /health
→ { status: "ok", timestamp: "...", uptime: 123.45 }
```