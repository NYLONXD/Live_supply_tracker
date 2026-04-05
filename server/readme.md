# 🚚 Supply Tracker – Server

Backend server for **Supply Tracker**, built with **Node.js, Express, MongoDB, Redis**, and **Docker**.
Handles authentication, admin operations, shipment management, driver assignment, caching, and real-time updates.

---

## 📦 Tech Stack
    
* **Node.js**
* **Express.js**
* **MongoDB** (Database)
* **Redis** (Caching)
* **Docker** (Redis container)
* **JWT** (Authentication)
* **Mongoose** (ODM)
* **Socket.IO** (Real-time updates – if enabled)

---

## 📁 Project Structure

```text
server/
│── controllers/
│── models/
│── routes/
│── services/
│── config/
│── middleware/
│── utils/
│── index.js
│── package.json
│── .env
```

---

## ✅ Prerequisites

Make sure you have these installed:

* **Node.js** (v18+ recommended)
* **MongoDB** (local or Atlas)
* **Docker Desktop** (for Redis)
* **Git**

Check versions:

```bash
node -v
docker -v
mongo --version
```

---

## ⚙️ Environment Setup

Create a `.env` file inside the `server` directory:

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/supplyTracker

JWT_SECRET=your_jwt_secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

NODE_ENV=development
```

---

## 📥 Install Dependencies

```bash
npm install
```

---

## 🧠 Redis Setup (Using Docker)

### Pull Redis Image

```bash
docker pull redis:7
```

### Run Redis Container

```bash
docker run -d --name redis-cache -p 6379:6379 redis:7
```

### Verify Redis

```bash
docker exec -it redis-cache redis-cli ping
```

Expected output:

```text
PONG
```

---

## 🍃 MongoDB Setup

### Option 1: Local MongoDB

Ensure MongoDB service is running:

```bash
mongod
```

### Option 2: MongoDB Compass

Connect using:

```text
mongodb://localhost:27017
```

Database used:

```text
supplyTracker
```

---

## ▶️ Run the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server runs at:

```text
http://localhost:5000
```

---

## 🔐 Authentication & Roles

### User Roles

* `admin`
* `driver`
* `customer`

### Architecture Rules

* **Users collection** → authentication & roles
* **Drivers collection** → driver profile linked via `userId`
* Email & password exist **only in Users**
* Admin should **never** be created as a driver

---

## 📌 Core API Routes

### Admin Routes

```text
POST   /api/admin/login
POST   /api/admin/shipments/:shipmentId/assign
GET    /api/admin/analytics
```

### Shipment Routes

```text
POST   /api/shipments
GET    /api/shipments
GET    /api/shipments/:id
```

### Driver Routes

```text
POST   /api/driver/register
GET    /api/driver/shipments
```

---

## 🧠 Redis Caching Strategy

* **Cache-Aside Pattern**
* Redis checked first
* MongoDB queried if cache miss
* Cache updated with TTL

Example keys:

```text
shipments:list
shipment:{id}
analytics:admin
```

---

## 🔄 Docker Commands (Quick Reference)

Stop Redis:

```bash
docker stop redis-cache
```

Start Redis:

```bash
docker start redis-cache
```

Remove Redis:

```bash
docker rm -f redis-cache
```

---

## 🧪 Postman Testing

Base URL:

```text
http://localhost:5000
```

Headers:

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

---

## 🛑 Common Issues & Fixes

### Redis connection error

* Ensure Redis container is running
* Verify `REDIS_HOST` & `REDIS_PORT`

### Duplicate key error (drivers)

* Admin user reused incorrectly as driver
* Each driver must have its own User record

### 404 Route Not Found

* Ensure plural routes (`/shipments` not `/shipment`)
* Verify route mounting in `index.js`

---

## 📌 Important Design Rules

* One **User** = one login identity
* **Driver** is a role-specific profile
* Cache must be invalidated after updates

---

## 🚀 Future Improvements

* Rate limiting using Redis
* Background jobs for shipment updates
* Replace Redis `KEYS` with `SCAN`
* Role-based access middleware
* Automated tests (Jest / Supertest)

---

## 👨‍💻 Author

**Himanshu Jha**
Backend Developer | MERN | System Design
