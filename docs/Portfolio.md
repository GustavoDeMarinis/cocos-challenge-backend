# Portfolio Endpoint – Calculation Logic and Design Decisions

## Endpoint Overview

The Portfolio endpoint returns a consolidated view of a user’s account, including:

- **Total account value**
- **Available funds**
- **List of owned assets (positions)** with:
    - Quantity
    - Current market value
    - Total return percentage

This endpoint is not a simple CRUD projection of database entities. Instead, it represents a domain-specific read model, built by combining persisted data with runtime calculations.

## Data Sources

The portfolio is built using the following persisted data:

- `available_cash` (stored in the database)
- **User positions** (`positions`)
- **Instrument metadata** (`instruments`)
- **Latest market price per instrument** (`marketdata`, ordered by date descending)

No derived or aggregated state is persisted in the database. All financial metrics are calculated at request time.

## Calculation Logic

### Market Value per Position

For each position with available market data:

$$marketValue = quantity \times latestClosePrice$$

- The latest close price is obtained from the most recent `marketdata` record for the instrument.
- Positions without valid market price data are excluded from valuation.

### Total Account Value

The total account value represents the current economic value of the user’s account and is calculated as:

$$totalAccountValue = available\_cash + \sum (\text{market value of all positions})$$

This calculation includes:

- **Long positions** (positive quantity)
- **Short positions** (negative quantity)

Short positions contribute a negative market value, correctly reflecting their impact on the account’s net worth.

### Total Return Percentage (per listed position)

For each listed position, the total return percentage is calculated based on invested capital:

$$totalReturnPercent = \frac{marketValue - totalInvested}{totalInvested} \times 100$$

This represents the capital-based return of the position, answering the question:

> “What percentage gain or loss would I realize if I closed this position at current market prices?”

## Why Positions with Negative Quantity Are Excluded from the positions List

Positions with `quantity <= 0` represent short positions or closed positions, which are treated as liabilities rather than owned assets.

### Design decision:

- **Long positions** (`quantity > 0`)
    - Represent assets owned by the user
    - Included in the `positions` list
- **Short positions** (`quantity < 0`)
    - Represent obligations to repurchase assets
    - Excluded from the `positions` list
    - Still included in total account value calculations

This approach aligns with standard financial portfolio representations, where:

1. The asset list reflects what the user owns.
2. The account value reflects the full economic exposure.

## Architectural Note

The Portfolio endpoint returns a domain-specific DTO rather than a Prisma-generated type.
Persistence-layer types are used internally to fetch data, but the API response is explicitly modeled to avoid leaking database structure into the API contract.
