import { Prisma } from "@prisma/client";

export const decimalToNumber = (value: Prisma.Decimal | number) =>
    typeof value === "number" ? value : value.toNumber();

export const calculateMarketValue = (quantity: number, marketPrice: number) =>
    quantity * marketPrice;

export const calculateTotalReturnPercent = (marketValue: number, total_invested: number) =>
    ((marketValue - total_invested) / total_invested) * 100;