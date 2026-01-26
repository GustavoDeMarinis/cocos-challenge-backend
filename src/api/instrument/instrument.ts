import { Prisma } from "@prisma/client";
import prisma from "../../integrations/prisma/prisma-client";
import { ErrorResult, PaginationOptions, SearchResult } from "../../utils/shared-types";
import { getQueryCount } from "../../utils/pagination";
import { logDebug } from "../../utils/logging";
const subService = "instrument/service";

const instrumentSelect = {
    id: true,
    name: true,
    ticker: true,
    type: true,
    marketdata: {
        take: 1,
        orderBy: { date: Prisma.SortOrder.desc },
        select: {
            close: true,
            previousclose: true,
            date: true,
        },
    },
}

export const instrumentArgs = Prisma.validator<Prisma.InstrumentDefaultArgs>()({
    select: instrumentSelect,
});

export type InstrumentResult = Prisma.InstrumentGetPayload<typeof instrumentArgs>;

export const searchInstrument = async (search: {
    name?: string;
    ticker?: string;
},
    { skip, take }: PaginationOptions): Promise<SearchResult<InstrumentResult> | ErrorResult> => {
    const or: Prisma.InstrumentWhereInput[] = [];
    if (search.name) {
        or.push({
            name: {
                contains: search.name,
                mode: "insensitive",
            },
        });
    }
    if (search.ticker) {
        or.push({
            ticker: {
                contains: search.ticker,
                mode: "insensitive",
            },
        });
    }
    const where: Prisma.InstrumentWhereInput = {
        type: {
            not: "MONEDA",
        },
        ...(or.length > 0 ? { OR: or } : {}),
    };
    const items = await prisma.instrument.findMany({
        select: instrumentSelect,
        where,
        skip,
        take,
    });
    const count = await getQueryCount(prisma.instrument, where);

    logDebug({
        subService,
        message: `Character Search found (${count}) results`,
        details: {
            count: count,
            filter: where,
        },

    });

    return {
        items,
        count,
    };
}