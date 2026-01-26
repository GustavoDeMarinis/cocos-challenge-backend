import { searchInstrument } from "../instrument";
import { prismaMock } from "../../../testing/mock-prisma";
import { getFakeInstrumentResult } from "../../../testing/fakes";
import { InstrumentType } from "../instrument-api.types";

describe("Instrument Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("searchInstrument", () => {
        it("should return instruments matching name search", async () => {
            const mockInstruments = [
                getFakeInstrumentResult({
                    id: 1,
                    name: "Apple Inc",
                    ticker: "AAPL",
                    type: InstrumentType.ACCIONES,
                }),
                getFakeInstrumentResult({
                    id: 2,
                    name: "Apple Hospitality",
                    ticker: "APLE",
                    type: InstrumentType.ACCIONES,
                }),
            ];

            prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 2 },
            } as any);

            const result = await searchInstrument(
                { name: "Apple" },
                { skip: 0, take: 10 }
            );

            expect(result).toEqual({
                items: mockInstruments,
                count: 2,
            });
            expect(prismaMock.instrument.findMany).toHaveBeenCalledWith({
                select: expect.any(Object),
                where: {
                    type: { not: "MONEDA" },
                    OR: [
                        {
                            name: {
                                contains: "Apple",
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                skip: 0,
                take: 10,
            });
        });

        it("should return instruments matching ticker search", async () => {
            const mockInstruments = [
                getFakeInstrumentResult({
                    id: 1,
                    name: "Apple Inc",
                    ticker: "AAPL",
                    type: InstrumentType.ACCIONES,
                }),
            ];

            prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 1 },
            } as any);

            const result = await searchInstrument(
                { ticker: "AAPL" },
                { skip: 0, take: 10 }
            );

            expect(result).toEqual({
                items: mockInstruments,
                count: 1,
            });
            expect(prismaMock.instrument.findMany).toHaveBeenCalledWith({
                select: expect.any(Object),
                where: {
                    type: { not: "MONEDA" },
                    OR: [
                        {
                            ticker: {
                                contains: "AAPL",
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                skip: 0,
                take: 10,
            });
        });

        it("should search by both name and ticker when both provided", async () => {
            const mockInstruments = [
                getFakeInstrumentResult({
                    id: 1,
                    name: "Tesla Inc",
                    ticker: "TSLA",
                    type: InstrumentType.ACCIONES,
                }),
            ];

            prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 1 },
            } as any);

            const result = await searchInstrument(
                { name: "Tesla", ticker: "TSLA" },
                { skip: 0, take: 10 }
            );

            expect(result).toEqual({
                items: mockInstruments,
                count: 1,
            });
            expect(prismaMock.instrument.findMany).toHaveBeenCalledWith({
                select: expect.any(Object),
                where: {
                    type: { not: "MONEDA" },
                    OR: [
                        {
                            name: {
                                contains: "Tesla",
                                mode: "insensitive",
                            },
                        },
                        {
                            ticker: {
                                contains: "TSLA",
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                skip: 0,
                take: 10,
            });
        });

        it("should return all non-MONEDA instruments when no search params provided", async () => {
            const mockInstruments = [
                getFakeInstrumentResult({
                    id: 1,
                    name: "Apple Inc",
                    ticker: "AAPL",
                    type: InstrumentType.ACCIONES,
                }),
                getFakeInstrumentResult({
                    id: 2,
                    name: "Tesla Inc",
                    ticker: "TSLA",
                    type: InstrumentType.ACCIONES,
                }),
            ];

            prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 2 },
            } as any);

            const result = await searchInstrument({}, { skip: 0, take: 10 });

            expect(result).toEqual({
                items: mockInstruments,
                count: 2,
            });
            expect(prismaMock.instrument.findMany).toHaveBeenCalledWith({
                select: expect.any(Object),
                where: {
                    type: { not: "MONEDA" },
                },
                skip: 0,
                take: 10,
            });
        });

        it("should apply pagination correctly", async () => {
            const mockInstruments = [
                getFakeInstrumentResult({
                    id: 11,
                    name: "Instrument 11",
                    ticker: "INS11",
                }),
            ];

            prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 100 },
            } as any);

            const result = await searchInstrument(
                { name: "Instrument" },
                { skip: 10, take: 5 }
            );

            expect(result).toEqual({
                items: mockInstruments,
                count: 100,
            });
            expect(prismaMock.instrument.findMany).toHaveBeenCalledWith({
                select: expect.any(Object),
                where: expect.any(Object),
                skip: 10,
                take: 5,
            });
        });

        it("should return empty array when no instruments match", async () => {
            prismaMock.instrument.findMany.mockResolvedValue([]);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 0 },
            } as any);

            const result = await searchInstrument(
                { name: "NonExistent" },
                { skip: 0, take: 10 }
            );

            expect(result).toEqual({
                items: [],
                count: 0,
            });
        });

        it("should exclude MONEDA type instruments from results", async () => {
            const mockInstruments = [
                getFakeInstrumentResult({
                    id: 1,
                    name: "Stock",
                    ticker: "STK",
                    type: InstrumentType.ACCIONES,
                }),
            ];

            prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
            prismaMock.instrument.aggregate.mockResolvedValue({
                _count: { id: 1 },
            } as any);

            await searchInstrument({}, { skip: 0, take: 10 });

            expect(prismaMock.instrument.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        type: { not: "MONEDA" },
                    }),
                })
            );
        });
    });

    it("should perform case-insensitive search by name", async () => {
        const mockInstruments = [
            getFakeInstrumentResult({
                id: 1,
                name: "Apple Inc",
                ticker: "AAPL",
                type: InstrumentType.ACCIONES,
            }),
        ];

        prismaMock.instrument.findMany.mockResolvedValue(mockInstruments);
        prismaMock.instrument.aggregate.mockResolvedValue({
            _count: { id: 1 },
        } as any);

        const result = await searchInstrument(
            { name: "aPpLe" },
            { skip: 0, take: 10 }
        );

        expect(result).toEqual({
            items: mockInstruments,
            count: 1,
        });

        expect(prismaMock.instrument.findMany).toHaveBeenCalledWith({
            select: expect.any(Object),
            where: {
                type: { not: "MONEDA" },
                OR: [
                    {
                        name: {
                            contains: "aPpLe",
                            mode: "insensitive",
                        },
                    },
                ],
            },
            skip: 0,
            take: 10,
        });
    });

});
