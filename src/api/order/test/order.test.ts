import { insertOrder, applyBuy } from "../order";
import { prismaMock } from "../../../testing/mock-prisma";
import { getFakeUser, getFakeInstrument, getFakeMarketData } from "../../../testing/fakes";
import { OrderSide, OrderType, OrderStatus } from "../order-api.types";
import { ErrorCode } from "../../../utils/shared-types";
import { Prisma } from "@prisma/client";

describe("Order Service", () => {
    const mockUser = getFakeUser({ id: 1, available_cash: new Prisma.Decimal(10000) });
    const mockInstrument = getFakeInstrument({ id: 1, ticker: "AAPL" });
    const mockMarketData = getFakeMarketData({ close: new Prisma.Decimal(150), instrumentid: 1 });
    const cashInstrument = getFakeInstrument({ id: 99, type: "MONEDA", name: "PESOS" });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Basic Validations", () => {

        it("should return error if instrumentIdToUse is missing for non-cash order", async () => {
            const result = await insertOrder({
                userid: 1,
                side: OrderSide.BUY,
                type: OrderType.LIMIT,
                size: 10,
                price: 100
            });

            expect(result).toEqual({
                code: ErrorCode.BadRequest,
                message: "Instrument ID must be provided for this type of order",
            });
        });

        it("should return error if instrument not found", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(null);

            const result = await insertOrder({
                userid: 1,
                instrumentid: 999,
                side: OrderSide.BUY,
                type: OrderType.LIMIT,
                size: 10,
                price: 100
            });

            expect(result).toEqual({
                code: ErrorCode.NotFound,
                message: "Instrument Not Found",
            });
        });

        it("should return error if monetary instrument not found for cash orders", async () => {
            prismaMock.instrument.findFirst.mockResolvedValue(null);

            const result = await insertOrder({
                userid: 1,
                side: OrderSide.CASH_IN,
                type: OrderType.MARKET,
                cash_amount: 1000
            });

            expect(result).toEqual({
                code: ErrorCode.NotFound,
                message: "Instrument for cash operations not found",
            });
        });
    });

    describe("Side-Specific Logic", () => {
        describe("CASH_IN", () => {
            it("should handle successful CASH_IN correctly", async () => {
                prismaMock.instrument.findFirst.mockResolvedValue(cashInstrument);
                prismaMock.instrument.findUnique.mockResolvedValue(cashInstrument);
                prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
                prismaMock.order.create.mockResolvedValue({
                    id: 1,
                    userid: 1,
                    instrumentid: 99,
                    size: 1000,
                    price: new Prisma.Decimal(1),
                    type: OrderType.MARKET,
                    side: OrderSide.CASH_IN,
                    status: OrderStatus.FILLED,
                    datetime: new Date(),
                } as any);
                prismaMock.order.findUnique.mockResolvedValue({
                    id: 1,
                    userid: 1,
                    instrumentid: 99,
                    size: 1000,
                    price: new Prisma.Decimal(1),
                    status: OrderStatus.FILLED,
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    side: OrderSide.CASH_IN,
                    type: OrderType.MARKET,
                    cash_amount: 1000
                });

                expect(result).toMatchObject({
                    status: OrderStatus.FILLED,
                    size: 1000
                });
                expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: { available_cash: { increment: 1000 } }
                }));
            });

            it("should handle successful CASH_IN with direct size", async () => {
                prismaMock.instrument.findFirst.mockResolvedValue(cashInstrument);
                prismaMock.instrument.findUnique.mockResolvedValue(cashInstrument);
                prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
                prismaMock.order.create.mockResolvedValue({
                    status: OrderStatus.FILLED,
                    size: 1000,
                    price: new Prisma.Decimal(1)
                } as any);
                prismaMock.order.findUnique.mockResolvedValue({
                    status: OrderStatus.FILLED,
                    size: 1000,
                    price: new Prisma.Decimal(1)
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    side: OrderSide.CASH_IN,
                    type: OrderType.MARKET,
                    size: 1000
                });

                expect(result).toMatchObject({
                    status: OrderStatus.FILLED,
                    size: 1000,
                    price: new Prisma.Decimal(1)
                });
            });
        });

        describe("CASH_OUT", () => {
            it("should handle successful CASH_OUT correctly", async () => {
                prismaMock.instrument.findFirst.mockResolvedValue(cashInstrument);
                prismaMock.instrument.findUnique.mockResolvedValue(cashInstrument);
                prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
                prismaMock.order.create.mockResolvedValue({
                    id: 1,
                    userid: 1,
                    instrumentid: 99,
                    size: 500,
                    price: new Prisma.Decimal(1),
                    type: OrderType.MARKET,
                    side: OrderSide.CASH_OUT,
                    status: OrderStatus.FILLED,
                    datetime: new Date(),
                } as any);
                prismaMock.order.findUnique.mockResolvedValue({
                    id: 1,
                    userid: 1,
                    instrumentid: 99,
                    size: 500,
                    price: new Prisma.Decimal(1),
                    status: OrderStatus.FILLED,
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    side: OrderSide.CASH_OUT,
                    type: OrderType.MARKET,
                    cash_amount: 500
                });

                expect(result).toMatchObject({
                    status: OrderStatus.FILLED,
                    size: 500
                });
                expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: { available_cash: { decrement: 500 } }
                }));
            });

            it("should handle successful CASH_OUT with direct size", async () => {
                prismaMock.instrument.findFirst.mockResolvedValue(cashInstrument);
                prismaMock.instrument.findUnique.mockResolvedValue(cashInstrument);
                prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
                prismaMock.order.create.mockResolvedValue({
                    status: OrderStatus.FILLED,
                    size: 500,
                    price: new Prisma.Decimal(1)
                } as any);
                prismaMock.order.findUnique.mockResolvedValue({
                    status: OrderStatus.FILLED,
                    size: 500,
                    price: new Prisma.Decimal(1)
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    side: OrderSide.CASH_OUT,
                    type: OrderType.MARKET,
                    size: 500
                });

                expect(result).toMatchObject({
                    status: OrderStatus.FILLED,
                    size: 500,
                    price: new Prisma.Decimal(1)
                });
            });

            it("should reject CASH_OUT if insufficient cash", async () => {
                prismaMock.instrument.findFirst.mockResolvedValue(cashInstrument);
                prismaMock.instrument.findUnique.mockResolvedValue(cashInstrument);
                prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, available_cash: new Prisma.Decimal(100), positions: [] } as any);
                prismaMock.order.create.mockResolvedValue({
                    status: OrderStatus.REJECTED
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    side: OrderSide.CASH_OUT,
                    type: OrderType.MARKET,
                    cash_amount: 1000
                });

                expect(result).toMatchObject({ status: OrderStatus.REJECTED });
            });
        });

        describe("BUY", () => {
            it("should reject BUY order if insufficient funds", async () => {
                prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
                prismaMock.user.findUnique.mockResolvedValue({
                    ...mockUser,
                    available_cash: new Prisma.Decimal(50),
                    positions: []
                } as any);
                prismaMock.order.create.mockResolvedValue({
                    id: 1,
                    status: OrderStatus.REJECTED
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    instrumentid: 1,
                    side: OrderSide.BUY,
                    type: OrderType.LIMIT,
                    size: 10,
                    price: 100
                });

                expect(result).toMatchObject({
                    status: OrderStatus.REJECTED
                });
            });
        });

        describe("SELL", () => {
            it("should reject SELL order if insufficient holdings", async () => {
                prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
                prismaMock.user.findUnique.mockResolvedValue({
                    ...mockUser,
                    positions: [{ instrument_id: 1, size: 5 }]
                } as any);
                prismaMock.order.create.mockResolvedValue({
                    id: 1,
                    status: OrderStatus.REJECTED
                } as any);

                const result = await insertOrder({
                    userid: 1,
                    instrumentid: 1,
                    side: OrderSide.SELL,
                    type: OrderType.LIMIT,
                    size: 10,
                    price: 100
                });

                expect(result).toMatchObject({
                    status: OrderStatus.REJECTED
                });
            });
        });
    });

    describe("Type-Specific Logic (MARKET)", () => {
        it("should resolve MARKET price from market data", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
            prismaMock.marketData.findFirst.mockResolvedValue(mockMarketData);
            prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
            prismaMock.order.create.mockResolvedValue({
                id: 1,
                status: OrderStatus.FILLED,
                price: new Prisma.Decimal(150),
                size: 10
            } as any);
            prismaMock.order.findUnique.mockResolvedValue({
                id: 1,
                status: OrderStatus.FILLED,
                price: new Prisma.Decimal(150),
                size: 10
            } as any);

            const result = await insertOrder({
                userid: 1,
                instrumentid: 1,
                side: OrderSide.BUY,
                type: OrderType.MARKET,
                size: 10
            });

            expect(result).toMatchObject({
                price: new Prisma.Decimal(150)
            });
        });

        it("should return error if no market data available for MARKET order", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
            prismaMock.marketData.findFirst.mockResolvedValue(null);

            const result = await insertOrder({
                userid: 1,
                instrumentid: 1,
                side: OrderSide.BUY,
                type: OrderType.MARKET,
                size: 10
            });

            expect(result).toEqual({
                code: ErrorCode.BadRequest,
                message: "No market data available for instrument",
            });
        });

        it("should return error if last close price is null for MARKET order", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
            prismaMock.marketData.findFirst.mockResolvedValue({ ...mockMarketData, close: null } as any);

            const result = await insertOrder({
                userid: 1,
                instrumentid: 1,
                side: OrderSide.BUY,
                type: OrderType.MARKET,
                size: 10
            });

            expect(result).toEqual({
                code: ErrorCode.BadRequest,
                message: "Cannot execute MARKET order: last close price is null",
            });
        });
    });

    describe("Size Resolution Logic", () => {
        it("should calculate size correctly from cash_amount in LIMIT order", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
            prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
            prismaMock.order.create.mockResolvedValue({
                id: 72,
                status: OrderStatus.NEW,
                size: 2,
                price: new Prisma.Decimal(10)
            } as any);

            const result = await insertOrder({
                userid: 2,
                instrumentid: 1,
                cash_amount: 28,
                type: OrderType.LIMIT,
                side: OrderSide.BUY,
                price: 10
            });

            expect(result).toMatchObject({
                size: 2,
                status: OrderStatus.NEW
            });
        });

        it("should reject order if calculated size is 0 (cash_amount < price)", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);
            prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, positions: [] } as any);
            prismaMock.order.create.mockResolvedValue({
                status: OrderStatus.REJECTED
            } as any);

            const result = await insertOrder({
                userid: 1,
                instrumentid: 1,
                cash_amount: 5,
                type: OrderType.LIMIT,
                side: OrderSide.BUY,
                price: 10
            });

            expect(result).toMatchObject({
                status: OrderStatus.REJECTED
            });
        });

        it("should return error if cash_amount provided but price is non-positive", async () => {
            prismaMock.instrument.findUnique.mockResolvedValue(mockInstrument);

            const result = await insertOrder({
                userid: 1,
                instrumentid: 1,
                side: OrderSide.BUY,
                type: OrderType.LIMIT,
                cash_amount: 1000,
                price: 0
            });

            expect(result).toEqual({
                code: ErrorCode.BadRequest,
                message: "Cannot calculate size without price",
            });
        });
    });

    describe("Apply Effects", () => {
        describe("applyBuy", () => {
            it("should create new position if it doesn't exist", async () => {
                prismaMock.position.findUnique.mockResolvedValue(null);

                const order = {
                    userid: 1,
                    instrumentid: 1,
                    size: 10,
                    price: new Prisma.Decimal(100)
                } as any;

                await applyBuy(prismaMock, order);

                expect(prismaMock.position.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        user_id: 1,
                        instrument_id: 1,
                        size: 10,
                        average_price: new Prisma.Decimal(100)
                    })
                });
                expect(prismaMock.user.update).toHaveBeenCalledWith({
                    where: { id: 1 },
                    data: { available_cash: { decrement: 1000 } }
                });
            });

            it("should update existing position and calculate new average price", async () => {
                prismaMock.position.findUnique.mockResolvedValue({
                    user_id: 1,
                    instrument_id: 1,
                    size: 10,
                    average_price: new Prisma.Decimal(100)
                } as any);

                const order = {
                    userid: 1,
                    instrumentid: 1,
                    size: 10,
                    price: new Prisma.Decimal(200)
                } as any;

                await applyBuy(prismaMock, order);

                // New average = (10 * 100 + 10 * 200) / 20 = 150
                expect(prismaMock.position.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        size: 20,
                        average_price: new Prisma.Decimal(150)
                    })
                }));
            });
        });
    });
});
