import { Prisma } from "@prisma/client";
import { logDebug } from "../../utils/logging";
import { ErrorCode, ErrorResult } from "../../utils/shared-types";
import prisma from "../../integrations/prisma/prisma-client";
import { calculateMarketValue, decimalToNumber } from "../../utils/calculators";
import { PortfolioGetResponse } from "./portfolio-api.types";
const subService = "portfolio/service";

const latestMarketDataSelect = {
    orderBy: { date: Prisma.SortOrder.desc },
    take: 1,
    select: {
        close: true,
        previousclose: true,
        date: true,
    },
};

export const portfolioUserSelect = {
    available_cash: true,
    orders: {
        select: {
            id: true,
            side: true,
            status: true,
            size: true,
            price: true,
        },
    },
    positions: {
        select: {
            id: true,
            size: true,
            average_price: true,
            realized_pnl: true,
            total_invested: true,
            instruments: {
                select: {
                    id: true,
                    ticker: true,
                    name: true,
                    type: true,
                    marketdata: latestMarketDataSelect
                },
            },
        },
    },
};

export const getPortfolio = async ({
    id,
}: Prisma.UserWhereUniqueInput): Promise<
    PortfolioGetResponse | ErrorResult
> => {
    const where: Prisma.UserWhereUniqueInput = {
        id,
    };
    const user = await prisma.user.findUnique({
        where,
        select: portfolioUserSelect,
    });

    if (!user) {
        return {
            code: ErrorCode.NotFound,
            message: "User Not Found",
        };
    }
    logDebug({
        subService,
        message: "User Retrieved by Id",
        details: { user },
    });
    return mapPortfolioResponse(user);
};

type PortfolioUser = Prisma.UserGetPayload<{
    select: typeof portfolioUserSelect;
}>;

export const mapPortfolioResponse = (user: PortfolioUser) => {
    const available_cash = decimalToNumber(user.available_cash)
    let totalAccountValue = available_cash;

    const positions = [];

    for (const position of user.positions) {
        const quantity = position.size;
        const invested = decimalToNumber(position.total_invested);

        const instrument = position.instruments;
        const marketData = instrument.marketdata[0];

        if (!marketData || marketData.close == null) continue;

        const closePrice = decimalToNumber(marketData.close);
        const marketValue = calculateMarketValue(quantity, closePrice);

        totalAccountValue += marketValue;

        if (quantity <= 0) continue;

        const totalReturnPercent =
            invested === 0
                ? 0
                : ((marketValue - invested) / invested) * 100;

        positions.push({
            instrumentId: instrument.id,
            ticker: instrument.ticker,
            name: instrument.name,
            quantity,
            marketValue,
            totalReturnPercent,
        });
    }

    return {
        totalAccountValue,
        available_cash,
        positions,
    };
};