import { Position, Prisma, User } from "@prisma/client";
import prisma from "../../integrations/prisma/prisma-client";
import { ErrorCode, ErrorResult } from "../../utils/shared-types";
import { OrderSide, OrderStatus, OrderType } from "./order-api.types";
import { isErrorResult } from "../../utils/exceptions";
import { decimalToNumber } from "../../utils/calculators";
import { logDebug } from "../../utils/logging";
const subService = "order/service";
const MONEDA_DEFAULT = "PESOS"

type OrderToInsert = {
  userid: number;
  instrumentid?: number;
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

  let instrumentIdToUse = orderToInsert.instrumentid;

  if (isCashOrder(orderToInsert)) {
    const cashInstrument = await prisma.instrument.findFirst({
      where: { type: "MONEDA", name: MONEDA_DEFAULT },
    });

    if (!cashInstrument) {
      return {
        code: ErrorCode.NotFound,
        message: "Instrument for cash operations not found",
      };
    }

    instrumentIdToUse = cashInstrument.id;
  }

  if (!instrumentIdToUse) {
    return {
      code: ErrorCode.BadRequest,
      message: "Instrument ID must be provided for this type of order",
    };
  }

  const instrument = await prisma.instrument.findUnique({
    where: { id: instrumentIdToUse },
  });

  if (!instrument) {
    return {
      code: ErrorCode.NotFound,
      message: "Instrument Not Found",
    };
  }

  let price: number | ErrorResult | undefined = undefined;

  // CASH
  if (isCashOrder(orderToInsert)) {
    price = 1;
  }

  // MARKET
  if (price === undefined && orderToInsert.type === OrderType.MARKET) {
    price = await getMarketPrice(instrumentIdToUse, orderToInsert);
    if (isErrorResult(price)) return price;
  }

  // LIMIT
  if (price === undefined) {
    price = decimalToNumber(orderToInsert.price!);
  }


  const sizeResult = resolveSize(orderToInsert, price);
  if (isErrorResult(sizeResult)) {
    return sizeResult;
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: orderToInsert.userid },
      include: {
        positions: {
          where: {
            instrument_id: instrumentIdToUse,
          },
        },
      },
    });

    if (!user) {
      return {
        code: ErrorCode.NotFound,
        message: "User Not Found",
      };
    }

    const status = resolveInitialStatus(
      orderToInsert,
      user,
      sizeResult,
      price
    );


    const order = await tx.order.create({
      select: OrderSelect,
      data: {
        userid: orderToInsert.userid,
        instrumentid: instrumentIdToUse,
        size: sizeResult,
        price,
        type: orderToInsert.type,
        side: orderToInsert.side,
        status,
        datetime: new Date(),
      },
    });

    logDebug({
      subService,
      message: `Order created`,
      details: {
        order: order,
      },

    });

    if (order.status !== OrderStatus.FILLED) {
      return order;
    }

    await applyFilledOrderEffects(tx, order);

    const updatedOrder = await tx.order.findUnique({
      where: { id: order.id },
      select: OrderSelect,
    });

    return updatedOrder!;
  });
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

const resolveInitialStatus = (
  order: OrderToInsert,
  user: User & { positions: Position[] },
  size: number,
  price: number
): OrderStatus => {
  if (
    order.side === OrderSide.CASH_IN
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
  if (size <= 0) {
    return OrderStatus.REJECTED;
  }
  return order.type === OrderType.MARKET
    ? OrderStatus.FILLED
    : OrderStatus.NEW;
};

const applyFilledOrderEffects = async (
  tx: Prisma.TransactionClient,
  order: OrderResult,
) => {
  switch (order.side) {
    case OrderSide.BUY:
      return applyBuy(tx, order);

    case OrderSide.SELL:
      return applySell(tx, order);

    case OrderSide.CASH_IN:
      return applyCashIn(tx, order);

    case OrderSide.CASH_OUT:
      return applyCashOut(tx, order);
  }
};


export const applyBuy = async (
  tx: Prisma.TransactionClient,
  order: OrderResult
): Promise<void> => {
  const position = await tx.position.findUnique({
    where: {
      user_id_instrument_id: {
        user_id: order.userid,
        instrument_id: order.instrumentid,
      },
    },
  });

  if (!position) {
    await tx.position.create({
      data: {
        user_id: order.userid,
        instrument_id: order.instrumentid,
        size: order.size,
        average_price: order.price,
        last_updated: new Date(),
      },
    });

    await tx.user.update({
      where: { id: order.userid },
      data: {
        available_cash: {
          decrement: order.size * decimalToNumber(order.price),
        },
      },
    });
    return;
  }

  const currentSize = position.size;
  const currentAvg = position.average_price;

  const newSize = position.size + order.size;

  const newAveragePrice = currentAvg
    .mul(currentSize)
    .add(order.price.mul(order.size))
    .div(newSize);

  await tx.position.update({
    where: {
      user_id_instrument_id: {
        user_id: order.userid,
        instrument_id: order.instrumentid,
      },
    },
    data: {
      size: newSize,
      average_price: newAveragePrice,
      last_updated: new Date(),
    },
  });

  await tx.user.update({
    where: { id: order.userid },
    data: {
      available_cash: {
        decrement: order.size * decimalToNumber(order.price),
      },
    },
  });
};

const applySell = async (
  tx: Prisma.TransactionClient,
  order: OrderResult,
) => {
  const revenue = order.size * decimalToNumber(order.price);

  await tx.user.update({
    where: { id: order.userid },
    data: {
      available_cash: {
        increment: revenue,
      },
    },
  });

  await tx.position.update({
    where: {
      user_id_instrument_id: {
        user_id: order.userid,
        instrument_id: order.instrumentid,
      },
    },
    data: {
      size: { decrement: order.size },
    },
  });
};

const applyCashIn = async (
  tx: Prisma.TransactionClient,
  order: OrderResult
) => {
  await tx.user.update({
    where: { id: order.userid },
    data: {
      available_cash: {
        increment: order.size,
      },
    },
  });
};

const applyCashOut = async (
  tx: Prisma.TransactionClient,
  order: OrderResult
) => {
  await tx.user.update({
    where: { id: order.userid },
    data: {
      available_cash: {
        decrement: order.size,
      },
    },
  });
};

const getMarketPrice = async (instrumentid: number, order: OrderToInsert): Promise<number | ErrorResult> => {
  if (isCashOrder(order)) {
    return 1
  }

  const lastMarketData = await prisma.marketData.findFirst({
    where: { instrumentid },
    orderBy: { date: "desc" },
  });

  if (!lastMarketData) {
    return {
      code: ErrorCode.BadRequest,
      message: "No market data available for instrument",
    };
  }

  if (lastMarketData.close == null) {
    return {
      code: ErrorCode.BadRequest,
      message: "Cannot execute MARKET order: last close price is null",
    };
  }
  return decimalToNumber(lastMarketData.close);
};

const isCashOrder = (order: OrderToInsert): boolean => {
  return order.side === OrderSide.CASH_IN || order.side === OrderSide.CASH_OUT;
};