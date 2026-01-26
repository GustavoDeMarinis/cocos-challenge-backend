import { Prisma, User } from "@prisma/client";
import prisma from "../../integrations/prisma/prisma-client";
import { ErrorCode, ErrorResult } from "../../utils/shared-types";
import { OrderSide, OrderStatus, OrderType } from "./order-api.types";
import { isErrorResult } from "../../utils/exceptions";

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
            positions: true,
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

    const size =
        orderToInsert.size ??
        0;

    const price =
        orderToInsert.price != null
            ? Number(orderToInsert.price)
            : 0;


    const sizeResult = resolveSize(orderToInsert, price);

    if (isErrorResult(sizeResult)) {
        return sizeResult;
    }

    const status = resolveInitialStatus(orderToInsert.type);

    const order = await prisma.order.create({
        select: OrderSelect,
        data: {
            userid: orderToInsert.userid,
            instrumentid: orderToInsert.instrumentid,
            size,
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
    return value === OrderSide.BUY || value === OrderSide.SELL;
};

const isOrderType = (value: string): value is OrderType => {
    return value === OrderType.LIMIT || value === OrderType.MARKET;
};

const hasEnoughCash = (user: User, size: number, price: number): boolean => {
    const requiredAmount = size * price;
    return Number(user.available_cash) >= requiredAmount;
};

const createRejectedOrder = async (
    orderToInsert: OrderToInsert,
    size: number,
    price: number
) => {
    return prisma.order.create({
        select: OrderSelect,
        data: {
            userid: orderToInsert.userid,
            instrumentid: orderToInsert.instrumentid,
            size,
            price,
            type: orderToInsert.type,
            side: orderToInsert.side,
            status: OrderStatus.REJECTED,
            datetime: new Date(),
        },
    });
};

const resolveInitialStatus = (type: OrderType): OrderStatus => {
    return type === OrderType.MARKET
        ? OrderStatus.FILLED
        : OrderStatus.NEW;
};
/* export const insertOrder = async (
    orderToInsert: OrderToInsert
): Promise<OrderResult | ErrorResult> => {

    const user = await prisma.user.findUnique({
        where: { id: orderToInsert.userid },
    });
    if (!user) {
        return { code: ErrorCode.NotFound, message: "User Not Found" };
    }

    const instrument = await prisma.instrument.findUnique({
        where: { id: orderToInsert.instrumentid },
    });
    if (!instrument) {
        return { code: ErrorCode.NotFound, message: "Instrument Not Found" };
    }

    if (
        orderToInsert.type === OrderType.LIMIT &&
        orderToInsert.price == null
    ) {
        return {
            code: ErrorCode.BadRequest,
            message: "LIMIT orders require price",
        };
    }

    // Resolve price
    let orderPrice = 0;

    if (orderToInsert.type === OrderType.MARKET) {
        const marketData = await prisma.marketData.findFirst({
            where: { instrumentid: orderToInsert.instrumentid },
            orderBy: { date: Prisma.SortOrder.desc },
        });

        if (!marketData) {
            return {
                code: ErrorCode.BadRequest,
                message: "No market data available",
            };
        }

        orderPrice = Number(marketData.close);
    } else {
        orderPrice = Number(orderToInsert.price);
    }

    const requiredCash = orderToInsert.size * orderPrice;

    // BUY validation
    if (orderToInsert.side === OrderSide.BUY) {
        if (Number(user.available_cash) < requiredCash) {
            return prisma.order.create({
                select: OrderSelect,
                data: {
                    ...orderToInsert,
                    price: orderPrice,
                    status: OrderStatus.REJECTED,
                    datetime: new Date(),
                },
            });
        }
    }

    // SELL validation
    if (orderToInsert.side === OrderSide.SELL) {
        const position = await prisma.order.aggregate({
            where: {
                userid: orderToInsert.userid,
                instrumentid: orderToInsert.instrumentid,
                status: OrderStatus.FILLED,
            },
            _sum: { size: true },
        });

        const availableSize = Number(position._sum.size ?? 0);

        if (availableSize < orderToInsert.size) {
            return prisma.order.create({
                select: OrderSelect,
                data: {
                    ...orderToInsert,
                    price: orderPrice,
                    status: OrderStatus.REJECTED,
                    datetime: new Date(),
                },
            });
        }
    }

    return prisma.order.create({
        select: OrderSelect,
        data: {
            ...orderToInsert,
            price: orderPrice,
            status: resolveInitialStatus(orderToInsert.type),
            datetime: new Date(),
        },
    });
}; */
