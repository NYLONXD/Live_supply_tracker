# 🚚 Supply Tracker — Client

Frontend for **Supply Tracker**, a multi-tenant live logistics platform built with React + Vite + Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| HTTP | Axios |
| Real-time | Socket.IO Client |
| Maps (Admin/Driver) | Google Maps JS API |
| Maps (User tracking) | Mapbox GL JS |
| Charts | Recharts |
| Forms | React Hook Form |
| Notifications | react-hot-toast |
| Date utils | date-fns |
| Auth (Firebase) | Firebase (Auth + Firestore — legacy, largely replaced by JWT) |

---

## Project Structure

```
client/src/
├── assets/                    # Images, logos
├── components/
│   └── common/
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Input.jsx
│       ├── Badge.jsx
│       ├── Modal.jsx
│       ├── Loader.jsx
│       ├── Table.jsx
│       ├── Navbar.jsx
│       ├── DashboardLayout.jsx       # Sidebar + nav — role-aware dark/light mode
│       ├── NotificationBell.jsx      # Real-time bell with Socket.IO push
│       ├── GoogleShipmentMap.jsx     # Google Maps route + driver marker
│       ├── GooglePlacesInput.jsx     # Places Autocomplete input
│       └── common/
│           ├── Logo.jsx
│           └── PageLoader.jsx        # Route-transition loader
├── context/                   # Legacy contexts (largely superseded by Zustand)
├── hooks/
│   ├── useAuth.js             # Role-based redirect guard
│   ├── useShipments.js
│   ├── useSocket.js
│   ├── useGeolocation.js
│   └── useDraft.js            # IndexedDB-backed form draft persistence
├── pages/
│   ├── Public/
│   │   ├── Landing.jsx        # Marketing landing page
│   │   └── Track.jsx          # Public shipment tracking (no login required)
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── RegisterShop.jsx   # Creates org + admin account
│   │   ├── VerifyEmail.jsx    # 6-digit OTP with auto-advance inputs
│   │   ├── ForgetPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   └── JoinOrg.jsx        # Accept invite link → create account
│   ├── Admin/
│   │   ├── Dashboard.jsx
│   │   ├── AllShipments.jsx
│   │   ├── CreateShipment.jsx # Google Places + Google Directions + map preview
│   │   ├── Drivers.jsx
│   │   ├── Users.jsx          # Invite management + user roster
│   │   └── Analytics.jsx
│   ├── Driver/
│   │   ├── Dashboard.jsx
│   │   ├── MyDeliveries.jsx
│   │   └── Navigation.jsx     # Live GPS sharing via Socket.IO
│   ├── User/
│   │   ├── Dashboard.jsx
│   │   ├── MyShipments.jsx
│   │   ├── CreateShipment.jsx # Mapbox geocoding + AI ETA preview
│   │   └── TrackShipment.jsx  # Mapbox GL live map
│   ├── Notifications/
│   │   └── Notifications.jsx  # Full notification center
│   └── support/
│       ├── Support.jsx        # Ticket creation with category picker
│       └── SupportTickets.jsx # Ticket list + detail/thread view
├── services/
│   ├── api.js                 # Axios instance + all API helpers
│   └── socket.service.js      # Socket.IO singleton
├── stores/
│   └── authStore.jsx          # Zustand store — login/logout/checkAuth
└── utils/
    ├── constants.js
    ├── helpers.js
    ├── validators.js
    ├── formatTime.js
    └── googleMaps.js          # Lazy Google Maps loader (loads once per tab)
```

---

## Prerequisites

- Node.js v18+
- A running Supply Tracker server (see server README)
- Google Maps API key (with Maps JS, Places, Directions APIs enabled)
- Mapbox public token

---

## Environment Variables

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_MAPBOX_TOKEN=pk.your_mapbox_token
VITE_FIREBASE_API_KEY=your_firebase_key   # only if Firebase Auth is used
```

---

## Installation & Running

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Dev server starts at `http://localhost:5173`.

---

## Roles & Routing

The app has three authenticated roles, each with its own dashboard and navigation:

| Role | Entry path | Description |
|---|---|---|
| `admin` | `/admin/dashboard` | Full org management — shipments, drivers, users, analytics |
| `driver` | `/driver/dashboard` | Assigned deliveries, live GPS navigation |
| `user` | `/user/dashboard` | Create and track own shipments |

Public routes (`/`, `/track`, `/track/:trackingNumber`) require no login.

### Protected Route Logic (`ProtectedRoute`)

1. Waits for `checkAuth()` to resolve on cold load
2. Redirects unauthenticated users to `/login`
3. Redirects wrong-role users back to `/`
4. Redirects unverified emails to `/verify-email`
5. Redirects admin/driver without `organizationId` to `/register-shop`

---

## Auth Flow

```
Register Shop  →  POST /api/organizations/register
                  └─ Creates org + admin user + sends OTP email

Verify Email   →  POST /api/auth/verify-email  (6-digit OTP)

Login          →  POST /api/auth/login
                  └─ Sets httpOnly cookie "token"

Check Auth     →  GET /api/auth/me  (called on every cold load)

Join via Invite → GET /api/invites/:token/validate
                  POST /api/invites/:token/accept
                  └─ Account created as driver or user, auto-verified
```

---

## Key Features

### Real-time tracking
`socket.service.js` is a singleton initialized in `main.jsx`. Components subscribe to shipment rooms with `joinShipment(trackingNumber)` and receive `location_updated`, `status_updated`, and `eta_updated` events.

### Live driver GPS
On the Navigation page the driver calls `navigator.geolocation.watchPosition`, then emits `driver_location_update` via Socket.IO every time the position changes. The server recalculates ETA using Mapbox and broadcasts it to all subscribers.

### Form draft persistence (`useDraft`)
The admin and user shipment creation forms persist form state to **IndexedDB** with a 400ms debounce. A banner is shown on next visit offering to restore or discard the draft.

### Google Maps integration
- `GooglePlacesInput` mounts the Autocomplete widget exactly once (stable ref pattern, no re-registration on re-render).
- `GoogleShipmentMap` renders the stored `routeGeometry` polyline on load and updates the driver marker in real time.
- The `loadGoogleMaps` utility loads the SDK script lazily and returns a singleton promise, preventing duplicate script tags.

### Notification bell
`NotificationBell` polls `/api/notifications/unread-count` every 30 seconds and also listens for real-time `notification` events from Socket.IO. The dropdown panel fetches the full list on first open.

### Dark / light mode
`DashboardLayout` applies `class="dark"` to `document.documentElement` when the logged-in role is `admin` or `driver`, and removes it for `user`. This is cleaned up on unmount.

---

## UI Design System

| Token | Value |
|---|---|
| Brand black | `#000000` |
| Brand white | `#FFFFFF` |
| Neon blue | `#00f0ff` |
| Neon green | `#00ff66` |
| Neon pink | `#ff003c` |
| Neon purple | `#b000ff` |
| Font | Inter, system-ui |
| Border radius | 0 / 2px / 4px / 6px / 8px |

The admin and driver dashboards use a dark glassmorphism aesthetic (`glass-dark`). The user dashboard and public pages use a clean light aesthetic.

---

## API Service (`services/api.js`)

A single Axios instance with `withCredentials: true` (sends the JWT cookie on every request).

A response interceptor handles 401 responses: if a `user` key exists in `localStorage` and the current path is not a public page, it clears the session and redirects to `/login`.

Exported API namespaces: `authAPI` · `shipmentAPI` · `adminAPI` · `driverAPI` · `analyticsAPI` · `tasksAPI` · `aiAPI` · `organizationAPI` · `notificationAPI` · `supportAPI` · `inviteAPI`

---

## Deployment (Vercel)

`vercel.json` rewrites all paths to `/index.html` for client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Set all `VITE_*` environment variables in the Vercel project settings before deploying.