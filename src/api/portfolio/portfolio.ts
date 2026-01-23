import { Prisma } from "@prisma/client";
import { User } from "@prisma/client";
import { logDebug } from "../../utils/logging";
import { ErrorResult } from "../../utils/shared-types";
import prisma from "../../integrations/prisma/prisma-client";
const subService = "portfolio/service";

export const portfolioUserSelect = {
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
                    marketdata: {
                        orderBy: {
                            date: "desc",
                        },
                        take: 1,
                        select: {
                            close: true,
                            previousclose: true,
                            date: true,
                        },
                    },
                },
            },
        },
    },
};

export const getPortfolio = async ({
    id,
}: Prisma.UserWhereUniqueInput): Promise<
    Omit<User, "password"> | ErrorResult
> => {
    const where: Prisma.UserWhereUniqueInput = {
        id,
    };
    const user = await prisma.user.findUniqueOrThrow({
        where,
        select: portfolioUserSelect,
    });
    if (user) {
        logDebug({
            subService,
            message: "User Retrieved by Id",
            details: { user },
        });
    }
    return user;
};
