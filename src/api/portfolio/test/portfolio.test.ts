import { getPortfolio, mapPortfolioResponse } from "../portfolio";
import { getFakePortfolioUser, getFakeUser, getFakeInstrument, getFakeMarketData, getFakePosition } from "../../../testing/fakes";
import { ErrorCode } from "../../../utils/shared-types";
import { Prisma } from "@prisma/client";
import { prismaMock } from "../../../testing/mock-prisma";
describe("Portfolio Service", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getPortfolio", () => {
        it("should return NotFound error if user does not exist", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await getPortfolio({ id: 999 });

            expect(result).toEqual({
                code: ErrorCode.NotFound,
                message: "User Not Found",
            });
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
                select: expect.any(Object),
            });
        });

        it("should return portfolio data when user exists", async () => {
            const fakePortfolioUser = getFakePortfolioUser({
                available_cash: new Prisma.Decimal(10000),
            });
            const fakeUser = { ...getFakeUser(), ...fakePortfolioUser };
            prismaMock.user.findUnique.mockResolvedValue(fakeUser);

            const result = await getPortfolio({ id: 1 });

            expect(result).toHaveProperty("totalAccountValue");
            expect(result).toHaveProperty("available_cash", 10000);
            expect(result).toHaveProperty("positions");
        });
    });

    describe("mapPortfolioResponse Calculation Logic", () => {
        it("should calculate correctly with LONG positions", () => {
            const fakeUser = getFakePortfolioUser({
                available_cash: new Prisma.Decimal(1000),
                positions: [
                    {
                        id: 1,
                        size: 10,
                        average_price: new Prisma.Decimal(100),
                        realized_pnl: new Prisma.Decimal(0),
                        total_invested: new Prisma.Decimal(1000), // 10 * 100
                        instruments: {
                            id: 1,
                            ticker: "AAPL",
                            name: "Apple",
                            type: "ACCIONES",
                            marketdata: [
                                {
                                    close: new Prisma.Decimal(110), // Current price
                                    previousclose: new Prisma.Decimal(100),
                                    date: new Date(),
                                },
                            ],
                        },
                    },
                ],
            });

            const result = mapPortfolioResponse(fakeUser);

            // Market Value = 10 * 110 = 1100
            // Total Account = 1000 (cash) + 1100 (MV) = 2100
            // Return % = ((1100 - 1000) / 1000) * 100 = 10%

            expect(result.available_cash).toBe(1000);
            expect(result.totalAccountValue).toBe(2100);
            expect(result.positions).toHaveLength(1);
            expect(result.positions[0]).toEqual({
                instrumentId: 1,
                ticker: "AAPL",
                name: "Apple",
                quantity: 10,
                marketValue: 1100,
                totalReturnPercent: 10,
            });
        });

        it("should EXCLUDE SHORT positions from list but INCLUDE in value", () => {
            const fakeUser = getFakePortfolioUser({
                available_cash: new Prisma.Decimal(2000),
                positions: [
                    {
                        id: 1,
                        size: -5, // SHORT 5 units
                        average_price: new Prisma.Decimal(100),
                        realized_pnl: new Prisma.Decimal(0),
                        total_invested: new Prisma.Decimal(-500),
                        instruments: {
                            id: 1,
                            ticker: "TSLA",
                            name: "Tesla",
                            type: "ACCIONES",
                            marketdata: [
                                {
                                    close: new Prisma.Decimal(90),
                                    previousclose: new Prisma.Decimal(100),
                                    date: new Date(),
                                },
                            ],
                        }
                    }
                ],
            });

            const result = mapPortfolioResponse(fakeUser);

            // Market Value = -5 * 90 = -450
            // Total Account = 2000 (cash) + (-450) = 1550

            expect(result.available_cash).toBe(2000);
            expect(result.totalAccountValue).toBe(1550);
            expect(result.positions).toHaveLength(0);
        });

        it("should handle mixed positions correctly", () => {
            const fakeUser = getFakePortfolioUser({
                available_cash: new Prisma.Decimal(1000),
                positions: [
                    getFakePosition({
                        // Long Position: Value = 10 * 10 = 100
                        size: 10,
                        total_invested: new Prisma.Decimal(80),
                        instruments: {
                            ...getFakeInstrument({
                                id: 1,
                                ticker: "LONG",
                                name: "Long Asset",
                            }),
                            marketdata: [
                                getFakeMarketData({
                                    close: new Prisma.Decimal(10),
                                }),
                            ],
                        },
                    }),
                    getFakePosition({
                        // Short Position: Value = -5 * 20 = -100
                        size: -5,
                        total_invested: new Prisma.Decimal(-100),
                        instruments: {
                            ...getFakeInstrument({
                                id: 2,
                                ticker: "SHORT",
                                name: "Short Asset",
                            }),
                            marketdata: [
                                getFakeMarketData({
                                    close: new Prisma.Decimal(20),
                                }),
                            ],
                        },
                    }),
                ],
            });

            const result = mapPortfolioResponse(fakeUser);

            // Total Account = 1000 + 100 - 100 = 1000
            expect(result.totalAccountValue).toBe(1000);
            expect(result.positions).toHaveLength(1); // Only the Long position
            expect(result.positions[0].ticker).toBe("LONG");
        });

        it("should skip positions with no market data", () => {
            const fakeUser = getFakePortfolioUser({
                available_cash: new Prisma.Decimal(1000),
                positions: [
                    getFakePosition({
                        size: 10,
                        total_invested: new Prisma.Decimal(100),
                        instruments: {
                            ...getFakeInstrument(),
                            marketdata: [],
                        },
                    }),
                ],
            });

            const result = mapPortfolioResponse(fakeUser);

            expect(result.totalAccountValue).toBe(1000); // Only cash
            expect(result.positions).toHaveLength(0);
        });
    });
});
