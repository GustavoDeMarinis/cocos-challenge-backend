import { Position, Prisma, User } from "@prisma/client";
import prisma from "../../integrations/prisma/prisma-client";
import { ErrorCode, ErrorResult } from "../../utils/shared-types";
import { OrderSide, OrderStatus, OrderType } from "./order-api.types";
import { isErrorResult } from "../../utils/exceptions";
import { decimalToNumber } from "../../utils/calculators";

type OrderToInsert = {
    userid: number;
    instrumentid: number;
    size?: number;
    cash_amount?: number;
    type: string;
    side: string;
    price?: number | Prisma.Decimal;
};


export const OrderSelect = {
    id: true,
    userid: true,
    instrumentid: true,
    size: true,
    price: true,
    type: true,
    side: true,
    status: true,
    datetime: true,
    instruments: {
        select: {
            id: true,
            ticker: true,
            name: true,
            type: true,
        },
    },
    users: {
        select: {
            id: true,
            email: true,
            accountnumber: true,
            available_cash: true,
        },
    },
} as const;

export const orderArgs = Prisma.validator<Prisma.OrderDefaultArgs>()({
    select: OrderSelect,
});

export type OrderResult = Prisma.OrderGetPayload<typeof orderArgs>;

export const insertOrder = async (
    orderToInsert: OrderToInsert
): Promise<OrderResult | ErrorResult> => {

   const user = await prisma.user.findUnique({
    where: { id: orderToInsert.userid },
    include: {
        positions: {
            where: {
                instrument_id: orderToInsert.instrumentid,
            },
        },
    },
    });
    if (!user) {
        return {
            code: ErrorCode.NotFound,
            message: "User Not Found"
        };
    }

    const instrument = await prisma.instrument.findUnique({
        where: { id: orderToInsert.instrumentid },
    });
    if (!instrument) {
        return {
            code: ErrorCode.NotFound,
            message: "Instrument Not Found"
        };
    }

    if (!isOrderSide(orderToInsert.side)) {
        return {
            code: ErrorCode.BadRequest,
            message: "Invalid side"
        };
    }

    if (!isOrderType(orderToInsert.type)) {
        return {
            code: ErrorCode.BadRequest,
            message: "Invalid type"
        };
    }

    const price =
        orderToInsert.price != null
            ? Number(orderToInsert.price)
            : 0;


    const sizeResult = resolveSize(orderToInsert, price);

    if (isErrorResult(sizeResult)) {
        return sizeResult;
    }

    const status = resolveInitialStatus(orderToInsert, user, sizeResult, price);

    const order = await prisma.order.create({
        select: OrderSelect,
        data: {
            userid: orderToInsert.userid,
            instrumentid: orderToInsert.instrumentid,
            size: sizeResult,
            price,
            type: orderToInsert.type,
            side: orderToInsert.side,
            status,
            datetime: new Date(),
        },
    });
    return order;
};

const resolveSize = (
    order: OrderToInsert,
    price: number
): number | ErrorResult => {
    if (order.size != null) {
        return order.size;
    }

    if (order.cash_amount != null) {
        if (price <= 0) {
            return {
                code: ErrorCode.BadRequest,
                message: "Cannot calculate size without price",
            };
        }

        return Math.floor(order.cash_amount / price);
    }

    return {
        code: ErrorCode.BadRequest,
        message: "Either size or cash_amount must be provided",
    };
};

const isOrderSide = (value: string): value is OrderSide => {
    return (
        value === OrderSide.BUY ||
        value === OrderSide.SELL ||
        value === OrderSide.CASH_IN ||
        value === OrderSide.CASH_OUT
    );
};

const isOrderType = (value: string): value is OrderType => {
    return value === OrderType.LIMIT || value === OrderType.MARKET;
};

const resolveInitialStatus = (
    order: OrderToInsert,
    user: User & { positions: Position[] },
    size: number,
    price: number
): OrderStatus => {
    if (
        order.side === OrderSide.CASH_IN ||
        order.side === OrderSide.CASH_OUT
    ) {
        return OrderStatus.FILLED;
    }

    if (order.side === OrderSide.BUY) {
        const requiredCash = size * price;
        if (decimalToNumber(user.available_cash) < requiredCash) {
            return OrderStatus.REJECTED;
        }
    }

    if (order.side === OrderSide.CASH_OUT) {
        const requiredCash = size;

        if (decimalToNumber(user.available_cash) < requiredCash) {
            return OrderStatus.REJECTED;
        }
    }

    if (order.side === OrderSide.SELL) {
        const available = user.positions[0]?.size ?? 0;

        if (available < size) {
            return OrderStatus.REJECTED;
        }
    }

    return order.type === OrderType.MARKET
        ? OrderStatus.FILLED
        : OrderStatus.NEW;
};