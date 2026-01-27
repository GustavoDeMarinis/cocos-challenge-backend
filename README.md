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
    ```npx prisma init
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
