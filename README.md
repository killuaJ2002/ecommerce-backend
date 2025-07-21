# 🛒 E-commerce Backend

This is a backend project for an e-commerce application built with **Node.js**, **Prisma ORM**, and a SQL database. It handles user management, product catalog, order placement, and more.

---

## 📁 Project Structure

```
ᴹ ecommerce-backend
├── prisma/
│   ├── schema.prisma          # Prisma schema definitions
│   └── migrations/             # Migration history
├── src/
│   ├── index.js        # Server entry point
│   ├── routes/                # Route handlers
│   └── controllers/           # Business logic
├── .env                      # Environment variables
└── README.md
```

---

## 🧹 Prisma Schema Overview

### Models

- **User**

  - `id`, `name`, `email`
  - One user can place many orders.

- **Product**

  - `id`, `name`, `description`, `price`, `stock`
  - Represents an item in the catalog.

- **Order**

  - `id`, `userId`, `createdAt`
  - Linked to a `User`
  - Contains multiple `OrderItem`s

- **OrderItem**

  - `id`, `orderId`, `productId`, `quantity`, `price`
  - Intermediate model between Order and Product (many-to-many with extra fields)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/killuaJ2002/ecommerce-backend
cd ecommerce-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

Use descriptive names for future changes:

```bash
npx prisma migrate dev --name add-orderitem-relation
```

### 5. Start the server

```bash
npm run dev
```

---

## 📢 Example API Routes

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| `POST` | `/users`          | Create a new user      |
| `GET`  | `/products`       | List all products      |
| `POST` | `/orders`         | Create a new order     |
| `GET`  | `/orders/:userId` | Get user order history |

---

## 🧰 Tech Stack

- **Node.js**
- **Prisma ORM**
- **MySQL / PostgreSQL**
- **Express** (if used)
- **dotenv**

---

## 🧠 Concepts Used

- Relational modeling with Prisma
- One-to-many and many-to-many relationships
- Nested writes with `connect`, `create`
- Prisma Migrations

---

## 📝 License

MIT License

---

## 🤝 Contributing

Feel free to fork and submit a PR, or open an issue for bugs and improvements.
