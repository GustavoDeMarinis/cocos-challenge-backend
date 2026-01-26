import { FromSchema } from "json-schema-to-ts";
import { orderPostRequestBodySchema, orderPostResponseSchema } from "./order-api.schema";
import { CommonDeserializationOptions } from "../../utils/schema.types";


export type OrderPostRequestBody = FromSchema<typeof orderPostRequestBodySchema, CommonDeserializationOptions>;
export type OrderPostResponse = FromSchema<typeof orderPostResponseSchema, CommonDeserializationOptions>;

export enum OrderType {
    MARKET = "MARKET",
    LIMIT = "LIMIT",
}

export enum OrderSide {
    BUY = "BUY",
    SELL = "SELL",
    CASH_IN = "CASH_IN",
    CASH_OUT = "CASH_OUT",
}

export enum OrderStatus {
    NEW = "NEW",
    FILLED = "FILLED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
}