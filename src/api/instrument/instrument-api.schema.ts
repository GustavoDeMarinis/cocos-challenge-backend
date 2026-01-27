import { paginationRequestPropertySchema, paginationRequiredPropertiesSchema, paginationResponsePropertySchema } from "../../utils/pagination.types";

export const instrumentSearchRequestQueryParamsSchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
        },
        ticker: {
            type: "string",
        },
    ...paginationRequestPropertySchema,
    },
    additionalProperties: false,
} as const

export const instrumentSearchResponseSchema ={
    type: "object",
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                    },
                    name: {
                        type: "string",
                    },
                    ticker: {
                        type: "string",
                    },
                    type: {
                        type: "string",
                    },
                    marketdata:{
                        type: "object",
                        properties: {
                            close: {
                                type: "number",
                                nullable:true
                            },
                            previousclose: {
                                type: "number",
                                nullable:true
                            },
                            date: {
                                type: "string",
                                format: "date-time",
                                nullable:true
                            },
                        },
                        required: ["close", "previousclose", "date"],
                        additionalProperties: false,
                    }
                },
                required: ["id", "name", "ticker", "type", "marketdata"],
                additionalProperties: false,
            },
        },
        ...paginationResponsePropertySchema,
    },
    ...paginationRequiredPropertiesSchema,
} as const