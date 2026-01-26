# Instrument Endpoint – Search Logic and Design Decisions

## Endpoint Overview

The Instrument endpoint provides search functionality for tradable financial instruments (stocks, assets) available in the system. It returns:

- **Instrument metadata** (ID, name, ticker, type)
- **Latest market data** (close price, previous close, date)
- **Pagination support** for large result sets

This endpoint is designed for instrument discovery and selection, commonly used when placing orders or researching available assets.

## Data Sources

The instrument search is built using the following persisted data:

- **Instrument metadata** (`instruments` table)
  - `id` - Unique identifier
  - `name` - Full instrument name
  - `ticker` - Trading symbol
  - `type` - Instrument type (ACCIONES, MONEDA)
- **Latest market data** (`marketdata` table, ordered by date descending, limited to 1 record per instrument)
  - `close` - Latest closing price
  - `previousclose` - Previous closing price
  - `date` - Market data date

## Search Logic

### Query Parameters

The endpoint supports the following optional search parameters:

- **`name`** - Case-insensitive partial match on instrument name
- **`ticker`** - Case-insensitive partial match on ticker symbol
- **`pageOffset`** - Pagination offset (default: 0)
- **`pageLimit`** - Results per page (default: 10, max: 100)

### Search Behavior

When search parameters are provided:

- **Name only**: Returns instruments where the name contains the search term (case-insensitive)
- **Ticker only**: Returns instruments where the ticker contains the search term (case-insensitive)
- **Both name and ticker**: Returns instruments matching **either** name **or** ticker (OR logic)
- **No parameters**: Returns all tradable instruments (excluding MONEDA type)

### Filtering Rules

1. **Currency Exclusion**: Instruments with `type = "MONEDA"` are always excluded from search results
2. **Case-Insensitive**: All text searches are case-insensitive
3. **Partial Matching**: Searches use `contains` logic, not exact matching

### Example Queries

```
GET /instrument?name=Apple
→ Returns: Apple Inc, Apple Hospitality, etc.

GET /instrument?ticker=AAPL
→ Returns: Apple Inc (AAPL)

GET /instrument?name=Tesla&ticker=TSLA
→ Returns: Instruments matching "Tesla" OR "TSLA"

GET /instrument?pageOffset=10&pageLimit=5
→ Returns: Results 11-15 of all tradable instruments
```

## Response Structure

```json
{
  "items": [
    {
      "id": 1,
      "name": "Apple Inc",
      "ticker": "AAPL",
      "type": "ACCIONES",
      "marketdata": {
        "close": 150.25,
        "previousclose": 149.80,
        "date": "2026-01-25T00:00:00.000Z"
      }
    }
  ],
  "count": 1,
  "pageOffset": 0,
  "pageLimit": 10
}
```

## Design Decisions

### Why Exclude MONEDA (Currency) Instruments?

Currency instruments represent base currencies (e.g., USD, ARS) rather than tradable securities. They are excluded from search results because:

1. **Domain Context**: The search is intended for selecting tradable assets for orders
2. **User Experience**: Currency instruments are typically handled separately in financial applications
3. **Business Logic**: Prevents users from attempting to trade currency pairs as if they were stocks

### Why Use Partial Matching?

Partial matching (`contains` instead of exact match) provides a better user experience:

- Users can search "Apple" instead of typing the full "Apple Inc"
- Ticker searches work with partial symbols (e.g., "AA" finds "AAPL")
- Reduces friction in instrument discovery

### Why OR Logic for Combined Searches?

When both `name` and `ticker` are provided, the endpoint uses OR logic (not AND) because:

- **Broader Results**: Users typically want to find instruments matching either criterion
- **Flexibility**: Allows searching by name while also checking ticker symbols
- **Common Pattern**: Matches user expectations from other financial search interfaces

## Pagination

The endpoint uses offset-based pagination:

- **`pageOffset`**: Number of records to skip (default: 0)
- **`pageLimit`**: Maximum records to return (default: 10)
- **`count`**: Total number of matching records (useful for calculating total pages)

Example: To get page 3 with 20 items per page:
```
GET /instrument?pageOffset=40&pageLimit=20
```

## Performance Considerations

- **Database Indexes**: The `ticker` field has a unique index for fast lookups
- **Market Data Limit**: Only the latest market data record is fetched per instrument (using `take: 1` with `orderBy: date DESC`)
- **Count Optimization**: Uses `aggregate` with `_count` instead of full `count()` for better performance

## Architectural Note

The Instrument endpoint returns a domain-specific response structure that combines instrument metadata with the latest market data. The response is explicitly modeled as a DTO to:

1. Avoid exposing internal database structure
2. Provide a clean, predictable API contract
3. Include only the most recent market data (not the full history)
