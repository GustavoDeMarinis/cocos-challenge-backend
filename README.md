# Cocos Challenge Backend - API Documentation

## 1. Project Overview
This system is a specialized backend API designed to handle financial operations, including order placement, instrument management, and portfolio tracking. The primary objective of this project is to demonstrate **correctness, consistency, and clarity of domain logic** within a constrained technical environment.

While the system provides a robust foundation for financial movements, it prioritizes architectural integrity and predictable behavior over feature completeness. It solves the problem of maintaining a reliable ledger of trades and cash movements while ensuring data integrity across every transaction.

## 2. Architecture and Design Decisions
The project follows a **Layered Architecture** pattern to ensure a clean separation of concerns and improved maintainability:

*   **API Layer**: Handles HTTP concerns and serves as the entry point for external requests.
*   **Service Layer**: Encapsulates business logic, orchestrating interactions between the domain and persistence.
*   **Domain Layer**: Defines the core business rules and types.
*   **Persistence Layer**: Manages data storage and retrieval via Prisma ORM.

**Key Decisions:**
*   **DTOs vs. Models**: The system returns domain-specific Data Transfer Objects (DTOs) instead of raw database models. This decouples the public API contract from the internal database schema, allowing for independent evolution and internal denormalization (e.g., returning user metadata alongside an order).
*   **Predictability**: High priority was given to explicitness. Logic flows are linear and easy to audit, avoiding complex abstractions that could hide side effects.

## 3. Validation Strategy
Validation is handled at multiple levels to ensure defense-in-depth:

*   **Controller Level**: Request payloads are strictly validated using **Ajv schemas**. This ensures that the system only processes well-formed data and provides early feedback to the client.
*   **Domain Consistency**: Business rules (e.g., sufficient funds) are checked in the service layer before any persistence attempt.
*   **Persistence Safety**: Prisma-level constraints ensure that the final data adheres to the database's relational integrity.
*   **Intentional Duplication**: Some validations are intentionally duplicated at the API boundary and domain level to ensure that business safety is never compromised, even if the API contract changes.

## 4. Database Modeling Philosophy
The database schema was intentionally kept close to the structure obtained via `prisma db pull`. The primary goal was to **respect the existing database as a source of truth** rather than aggressively reshaping it.

Models were renamed only where necessary to follow standard conventions (Singular, PascalCase). While implementing database-level enums (e.g., for `OrderType` or `OrderSide`) would be a valid architectural improvement, they were left out in this iteration to avoid modifying the original schema beyond necessity, demonstrating a "least-invasive" integration approach.

## 5. Order Processing Rules
The system differentiates between various order intents and ensures their outcomes are consistent with real-world financial rules:

*   **Market vs. Limit**: MARKET orders resolve their price dynamically from the latest market data, while LIMIT orders require an explicit price provided by the user.
*   **Cash Operations**: `CASH_IN` and `CASH_OUT` are modeled as **MARKET** operations. This choice reflects their nature as immediate balance adjustments that do not require a matching engine or price discovery.
*   **Data Normalization**: The system accepts different input combinations (e.g., `size` or `cash_amount`) but normalizes them into a consistent internal format (e.g., calculating size derived from the available cash and price) before execution.

## 6. Error Handling Strategy
The API implements a **Unified Error Response** shape to facilitate client-side integration and system observability.

*   **Domain Errors**: Represent business rule violations (e.g., "Insufficient Funds") and often result in `REJECTED` orders rather than hard failures to preserve a full audit trail.
*   **Validation Errors**: Standard schema violations occurring before domain logic is triggered.
*   **Infrastructure Errors**: Low-level failures handled via standard HTTP status codes.
*   **Traceability**: Every failed attempt is persisted (when applicable) to ensure the system's history is fully auditable.

## 7. Transactions and Consistency
Financial integrity is guaranteed through the use of **Database Transactions**. 

Every order execution—including balance updates and position recalculations—is performed within an atomic scope. If any part of the operation fails, the entire transaction rolls back. While more advanced strategies (e.g., distributed locking or idempotency keys) are standard in large-scale production, the current transactional scope is sufficient and appropriate for the complexity of this challenge.

## 8. Endpoint Design Considerations
The currently implemented `POST /orders` endpoint is a **Unified Endpoint** that handles multiple sides (BUY, SELL, CASH_IN, CASH_OUT) and types (MARKET, LIMIT). 

**Strategic Trade-off:**
This design centralizes logic and simplifies the initial API surface. However, as business rules grow, this approach can increase conditional complexity. 

**Proposed Improvement (Out of Scope):**
A more scalable approach would be splitting order creation into intent-specific endpoints:
*   `POST /orders/buy/market`
*   `POST /orders/cash-in`

This would reduce validation branching and make business rules explicit per endpoint, though the unified approach was chosen here to keep the challenge scope contained and focused on the core resolution logic.

## 9. Intentional Non-Goals
To maintain focus on core domain logic and architectural clarity, the following features were **intentionally excluded**:

*   **Authentication / Authorization**: Excluded to focus on the business rules of the financial operations rather than identity management.
*   **Idempotency Keys**: Critical for production retry logic, but excluded to keep the transaction logic focused on the primary flow.
*   **Distributed Locking**: Necessary for high-concurrency environments; the current single-instance transaction model is sufficient for demonstrating correctness.
*   **Asynchronous Order Matching**: The system assumes immediate or simplified execution to focus on ledger consistency.
*   **External Market Integrations**: Market data is sourced from internal mocks to ensure the project remains self-contained.

## 10. Future Improvements (Carefully Scoped)
The following improvements are recognized as valuable next steps for production readiness:
*   **UUIDs**: Transitioning from auto-increment IDs to UUIDs to avoid predictable resource identifiers in the public API.
*   **Idempotency Hooks**: Adding support for idempotency keys to safely handle client retries without duplicating financial effects.
*   **Database Enums**: Introducing database-level enums to enforce domain constraints at the storage engine level.
*   **Containerization**: Providing a full Docker setup (including the application and database) for a more portable development environment.

## 11. Development Process
The project was developed using an iterative approach, with business rules and validations tracked through structured documentation and issues. 

Detailed specifications for order behaviors, including edge cases and validation rules, can be found in the [Order Documentation](docs/Order.md). This structured approach ensured that every implementation detail was backed by a clear business requirement or technical constraint.

## 12. Closing Notes
This project prioritizes **correctness, clarity, and explicit business rules**. Every architectural choice—from the layered service approach to the manual resolution of market prices—was made to demonstrate a high degree of reasoning and trade-off awareness. The system is designed to be conceptually simple but structurally robust enough to scale in complexity.
