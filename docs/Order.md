# Order Endpoint – Business Rules, Validation Logic and Design Decisions

The Order endpoint allows users to submit trading orders to the market. This endpoint represents a command-style write operation and is not a simple CRUD insert.

It is responsible for:
- **Payload Validation**: Using AJV schemas to ensure data integrity.
- **Value Resolution**: Determining derived values like market price and share size.
- **Business Rule Enforcement**: Checking for sufficient funds and holdings.
- **Persistence**: Recording the order and applying atomic financial side effects.

---

## API Endpoint

**`POST /order`**

| Header | Value |
| :--- | :--- |
| **Accept** | `application/json` |
| **Content-Type** | `application/json` |

---

## Order Specifications

### Supported Order Types

- **MARKET Orders**:
    - Executed immediately at the latest market price (`marketdata.close`).
    - Initial status is typically `FILLED` (unless rejected).
- **LIMIT Orders**:
    - Executed only at the specified price or better.
    - Initial status is `NEW`.
    - *Note: Execution/matching logic is out of scope for this challenge.*

### Supported Order Sides

| Side | Action | Description |
| :--- | :--- | :--- |
| **BUY** | Trade | Purchase a financial instrument using available cash. |
| **SELL** | Trade | Sell an owned instrument to receive cash. |
| **CASH_IN** | Funds | Deposit cash into the account (uses a unified ledger). |
| **CASH_OUT** | Funds | Withdraw cash from the account. |

> [!NOTE]
> Cash operations are modeled as orders to maintain a single unified ledger in the database.

---

## Request Schema and Validation

The request payload is strictly validated using AJV before reaching the service layer.

### Core Validation Rules
- `userid`, `type`, and `side` are always **required**.
- Either `size` or `cash_amount` must be provided (mutual exclusivity).
- **Fractional shares are not allowed**.
- All prices are expressed in **ARS**.
- `instrumentid` is mandatory for all non-cash orders.

### Conditional Logic
| Order Side | Mandatory Fields | Forbidden Fields | Forced Defaults |
| :--- | :--- | :--- | :--- |
| **BUY / SELL** | `instrumentid` | - | - |
| **LIMIT** | `price` | - | - |
| **MARKET** | - | `price` | - |
| **CASH_IN / OUT**| `size` | `instrumentid`, `price`, `cash_amount` | `type: MARKET` |

---

## Data Resolution

### Order Size Resolution
The final share quantity is resolved in the service layer:
- **If `size` is provided**: Used directly.
- **If `cash_amount` is provided**: Calculated as `floor(cash_amount / price)`.

### Price Resolution
- **MARKET Orders**: Uses the latest `marketdata.close`. If missing, the request fails.
- **LIMIT Orders**: Uses the explicit price provided in the request.
- **Cash Operations**: Uses a fixed price of `1`.

---

## Business Logic and Side Effects

### Initial Order Status
The system determines the status before persisting:
- **NEW**: For valid LIMIT orders.
- **FILLED**: For valid MARKET or CASH_IN orders.
- **REJECTED**: Persisted for traceability when:
    - `BUY` or `CASH_OUT` exceeds available cash.
    - `SELL` exceeds existing position size.

### Atomic Side Effects (FILLED Orders Only)
Only orders that transition to `FILLED` status trigger financial changes:

| Side | Position Effect | Cash Effect |
| :--- | :--- | :--- |
| **BUY** | Create/Update (Recalculate Avg Price) | Decrement `available_cash` |
| **SELL** | Decrement Size | Increment `available_cash` |
| **CASH_IN** | N/A | Increment `available_cash` |
| **CASH_OUT** | N/A | Decrement `available_cash` |

> [!IMPORTANT]
> All side effects are performed within a database transaction to ensure atomicity.

---

## API Responses

### Success Response - Market Buy (201 Created)
Returns the created order with denormalized metadata.

```json
{
  "id": 105,
  "userid": 4,
  "instrumentid": 34,
  "size": 10,
  "price": 885.8,
  "type": "MARKET",
  "side": "BUY",
  "status": "FILLED",
  "datetime": "2026-01-27T20:16:54.720Z",
  "instruments": {
    "id": 34,
    "ticker": "GGAL",
    "name": "Grupo Financiero Galicia",
    "type": "ACCIONES"
  },
  "users": {
    "id": 4,
    "email": "user@test.com",
    "accountnumber": "10001",
    "available_cash": 1142
  }
}
```

### Success Response - Calculated Size (Limit Buy)
This scenario shows how `size` is resolved when `cash_amount` and `price` are provided in a LIMIT order (Size = `floor(28 / 10) = 2`).

**Input:**
```json
{
  "userid": 2,
  "instrumentid": 1,
  "cash_amount": 28,
  "type": "LIMIT",
  "side": "BUY",
  "price": 10
}
```

**Output:**
```json
{
  "id": 72,
  "userid": 2,
  "instrumentid": 1,
  "size": 2,
  "price": 10,
  "type": "LIMIT",
  "side": "BUY",
  "status": "NEW",
  "datetime": "2026-01-28T01:51:37.454Z",
  "instruments": {
    "id": 1,
    "ticker": "DYCA",
    "name": "Dycasa S.A.",
    "type": "ACCIONES"
  },
  "users": {
    "id": 2,
    "email": "jose@test.com",
    "accountnumber": "10002",
    "available_cash": 382
  }
}
```

### Domain Errors
Returned when a business constraint is violated (e.g., resource not found).

```json
{
  "error": {
    "code": 404,
    "message": "User Not Found"
  }
}
```

### Validation Errors
Produced by the AJV validator before reaching business logic.

> [!WARNING]
> **Example**: `instrumentid must have required property. must match "then" schema.`

---

## Design Decisions & Notes

- **Unified Ledger**: The `orders` table acts as a full audit log of all financial movements, including deposits and withdrawals.
- **Stateless Balances**: No derived balances are stored; all validations rely on the current persisted state (truth in database).
- **Traceability**: `REJECTED` orders are stored to provide a complete history of user attempts.
- **Average Price Logic**: `BUY` operations recalculate position average price to allow for PnL analysis (used in Portfolio).
- **Cash as Market Orders**: Cash operations are forced to `MARKET` type because they are immediate balance adjustments that do not require a matching engine or price discovery. This avoids the need for a `price` field (which is always 1) and ensures instant execution (Status: `FILLED`).
- **Scope**: Cancel/Update order endpoints were intentionally excluded as they were not part of the initial requirements.
