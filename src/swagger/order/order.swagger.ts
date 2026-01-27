import { orderPostRequestBodySchema, orderPostResponseSchema } from "../../api/order/order-api.schema";
import { commonErrorsResponseSchema } from "../error.swagger";

const postOrder = {
    tags: ["Order"],
    description:
        "## Post Order\n" +
        "Creates a new order in the system. Supports Market and Limit orders, as well as Cash Deposits (CASH_IN) and Withdrawals (CASH_OUT).\n\n" +
        "### Trading Orders (BUY / SELL)\n" +
        "- **instrumentid**: Mandatory identifier for the asset.\n" +
        "- **Amount**: Either `size` (shares) or `cash_amount` (total investment) must be provided.\n" +
        "- **Type**: Can be `MARKET` or `LIMIT`.\n" +
        "- **Price**: Mandatory for `LIMIT` orders; automatically resolved from market data for `MARKET` orders.\n\n" +
        "### Cash Operations (CASH_IN / CASH_OUT)\n" +
        "- **size**: Mandatory field representing the cash amount to deposit or withdraw.\n" +
        "- **Type**: Must be `MARKET`.\n" +
        "- **Forbidden Fields**: `instrumentid`, `price`, and `cash_amount` must not be provided for cash operations.\n\n" +
        "### Key Features\n" +
        "- **Validation**: Automatically validates user funds for BUY/CASH_OUT and holdings for SELL.\n" +
        "- **Atomic Operations**: All updates (order creation, account balance, and positions) are performed within a database transaction.",
    operationId: "postOrder",
    requestBody: {
        description: "Order details",
        required: true,
        content: {
            "application/json": {
                schema: orderPostRequestBodySchema,
            },
        },
    },
    responses: {
        "201": {
            description: "Order created successfully",
            content: {
                "application/json": {
                    schema: orderPostResponseSchema,
                },
            },
        },
        ...commonErrorsResponseSchema,
    },
};

export const orderPaths = {
    "/order": {
        post: postOrder,
    },
};
