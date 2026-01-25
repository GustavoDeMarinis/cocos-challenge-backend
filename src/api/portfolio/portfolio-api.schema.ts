

export const portfolioRequestParamsSchema = {
    type: "object",
    properties: {
        userId: {
            type: "number",
            description: "User Id",
            checkIdIsNumber: true,
        },
    },
    additionalProperties: false,
    required: ["userId"],
} as const;

export const portfolioPositionSchema = {
    type: "array",
    items: {
        type: "object",
        properties: {
            instrumentId: {
                type: "number",
                description: "Instrument Id",
            },
            ticker: {
                type: "string",
                description: "Instrument ticker symbol",
            },
            name: {
                type: "string",
                description: "Instrument name",
            },
            quantity: {
                type: "number",
                description: "Number of units held",
            },
            marketValue: {
                type: "number",
                description: "Current market value of the position",
            },
            totalReturnPercent: {
                type: "number",
                description: "Total return of the position expressed as a percentage",
            },
        },
        additionalProperties: false,
        required: [
            "instrumentId",
            "ticker",
            "name",
            "quantity",
            "marketValue",
            "totalReturnPercent",
        ],
    },
} as const

export const portfolioGetResponseSchema = {
    type: "object",
    properties: {
        totalAccountValue: {
            type: "number",
            description: "Total Account Value",
        },
        available_cash: {
            type: "number",
            description: "Available Funds",
        },
        positions: portfolioPositionSchema,
    },
    additionalProperties: false,
    required: ["totalAccountValue", "available_cash", "positions"],
} as const;
