import { InstrumentType } from "../instrument/instrument-api.types";
import { OrderSide, OrderStatus, OrderType } from "./order-api.types";

export const orderPostRequestBodySchema = {
    type: "object",
    description: "Request payload for creating a market or limit order",
    additionalProperties: false,
    properties: {
        userid: {
            type: "number",
            description: "Unique identifier of the user placing the order",
        },
        instrumentid: {
            type: "number",
            description: "Identifier of the financial instrument to be traded",
        },
        size: {
            type: "number",
            minimum: 1,
            description: "Number of shares to trade. Either size or cash_amount must be provided",
        },
        cash_amount: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Total investment amount in pesos. System will calculate maximum shares (no fractions). Either size or cash_amount must be provided",
        },
        type: {
            type: "string",
            enum: Object.values(OrderType),
            description: "Order type (e.g. market or limit)",
        },
        side: {
            type: "string",
            enum: Object.values(OrderSide),
            description: "Order direction: BUY, SELL, CASH_IN (deposit), or CASH_OUT (withdrawal)",
        },
        price: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Limit price for the order. Required only for limit orders",
        },
    },
    required: ["userid","type", "side"],
    oneOf: [
        {
            required: ["size"],
        },
        {
            required: ["cash_amount"],
        },
    ],
    allOf: [
        {
            if: {
                properties: {
                    type: { const: OrderType.LIMIT },
                },
            },
            then: {
                required: ["price"],
            },
        },
    ],
} as const;

export const orderPostResponseSchema = {
    type: "object",
    description: "Response after creating an order",
    properties: {
        id: {
            type: "number",
            description: "Unique identifier of the created order",
        },
        userid: {
            type: "number",
            description: "User who placed the order",
        },
        instrumentid: {
            type: "number",
            description: "Instrument being traded",
        },
        size: {
            type: "number",
            description: "Number of shares in the order",
        },
        price: {
            type: "number",
            format: "decimal",
            description: "Price per share",
        },
        type: {
            type: "string",
            enum: Object.values(OrderType),
            description: "Order type",
        },
        side: {
            type: "string",
            enum: Object.values(OrderSide),
            description: "Order side",
        },
        status: {
            type: "string",
            enum: Object.values(OrderStatus),
            description: "Order status",
        },
        datetime: {
            type: "string",
            format: "date-time",
            description: "When the order was created",
        },
        instruments: {
            type: "object",
            description: "Instrument details",
            properties:{
                id: {
                    type: "number",
                    description: "Unique identifier of the instrument",
                },
                ticker: {
                    type: "string",
                    description: "Ticker symbol of the instrument",
                },
                name: {
                    type: "string",
                    description: "Name of the instrument",
                },
                type: {
                    type: "string",
                    enum: Object.values(InstrumentType),
                    description: "Type of the instrument",
                },
            },
            required:["id", "ticker", "name", "type"],
            additionalProperties: false,
        },
        users: {
            type: "object",
            description: "User details",
            properties:{
                id: {
                    type: "number",
                    description: "Unique identifier of the user",
                },
                email: {
                    type: "string",
                    description: "User email",
                },
                accountnumber: {
                    type: "string",
                    description: "User account number",
                },
                available_cash: {
                    type: "number",
                    format: "decimal",
                    description: "User available cash",
                },
            },
            required:["id", "email", "accountnumber", "available_cash"],
            additionalProperties: false,
        },
    },
    required: ["id", "userid", "instrumentid", "size", "price", "type", "side", "status", "datetime", "instruments", "users"],
    additionalProperties: false,
} as const;