# Cocos Challenge Backend

Backend API for the Cocos Challenge, developed using Node.js and Express.

## Description

This API allows users to:
- View their [Portfolio](docs/Portfolio.md) (total value, available cash, asset list with performance).
- Search for [Instruments](docs/Instrument.md) (by ticker or name with pagination).
- Place market and limit [Orders](docs/Order.md) (Buy/Sell, Cash Deposits/Withdrawals).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL
- Docker (optional, for running DB)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    Cp `.env.example` to `.env` (create one if it doesn't exist) and configure your `DATABASE_URL`.

### Database Setup

1.  Initialize Prisma:
    ```bash
    npx prisma init
    ```
2.  Run Prisma Db Pull:
    ```bash
    npx prisma db pull
    ```
3.  Generate Types:
    ```bash
    npx prisma generate
    ```

### Running the Application

- Development mode:
  ```bash
  npm run start
  ```
- Build and run:
  ```bash
  npm run build
  node dist/index.js
  ```

### Testing

Run unit/integration tests:
```bash
npm test
```

You can also explore and manually test the API using Swagger at:
```bash
http://localhost:5000/api-docs/
```

## Future Improvements 

The following improvements are acknowledged as valuable next steps:

- Endpoint Specialization  
  Replace the single unified POST /order endpoint with intent-specific endpoints such as:

  ```
  POST /orders/buy/market
  POST /orders/sell/limit
  POST /orders/cash-in
  POST /orders/cash-out
  ```

  This would significantly reduce conditional validation logic, make business intent explicit at the API level, simplify schemas, and reduce the risk of invalid field combinations as the domain grows.


- Stronger Identifiers  
  Replacing auto-increment IDs with UUID-based identifiers for public-facing resources.

- Database Enums  
  Enforcing domain constraints directly at the storage level.

- Containerization  
  Dockerized application and database for safer local development and testing.
