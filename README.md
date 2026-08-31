# Andarayaya Dashboard Backend

Express.js REST API backend for the Andarayaya ticketing system dashboard.

## Tech Stack
- **Node.js + Express.js**
- **MongoDB Atlas** (via Mongoose)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@newcluster.xxjla.mongodb.net/Andarayaya
PORT=5000
NODE_ENV=development
```

### 3. Run the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Overall stats: total orders, revenue, tickets sold, orders by status, daily revenue, payment method breakdown |

---

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all ticket orders |
| GET | `/api/orders/:id` | Single order with inventory breakdown |
| GET | `/api/orders/search` | Search orders by customer name |

#### Query Parameters for `GET /api/orders`
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `PAID` \| `PENDING` \| `CANCELLED` \| `FAILED` |
| `customerName` | string | Filter by customer first/last name (partial match) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

#### Query Parameters for `GET /api/orders/search`
| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Search by customer full name (partial match) |

---

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all unique customers with ticket counts |
| GET | `/api/customers/:email/orders` | All orders + tickets for a customer |

#### Query Parameters for `GET /api/customers`
| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Filter by customer name (partial match) |
| `email` | string | Filter by email (partial match) |

---

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | List logs with filters |
| GET | `/api/logs/summary` | Aggregate log counts by level, context, and top messages |

#### Query Parameters for `GET /api/logs`
| Param | Type | Description |
|-------|------|-------------|
| `level` | string | `info` \| `warn` \| `error` \| `debug` |
| `context` | string | Context filter (e.g. `tickets`) |
| `message` | string | Partial match on log message |
| `customerName` | string | Filter by customer full name |
| `orderId` | string | Filter by orderId |
| `startDate` | ISO date | Logs from this date |
| `endDate` | ISO date | Logs until this date |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 50) |

---

## Project Structure
```
Dashboard_backend/
├── src/
│   ├── config/
│   │   └── db.js                      # MongoDB connection
│   ├── controllers/
│   │   ├── dashboardController.js     # Dashboard summary stats
│   │   ├── ordersController.js        # Orders CRUD + filter
│   │   ├── customersController.js     # Customer lookup + tickets
│   │   └── logsController.js          # Logs filter + summary
│   ├── models/
│   │   ├── Phase.js
│   │   ├── TicketInventory.js
│   │   ├── TicketOrder.js
│   │   ├── TicketInventoryOrder.js
│   │   └── Log.js
│   ├── routes/
│   │   ├── dashboard.js
│   │   ├── orders.js
│   │   ├── customers.js
│   │   └── logs.js
│   ├── middleware/
│   │   └── errorHandler.js
│   └── server.js                      # Entry point
├── .env
├── .env.example
└── package.json
```
