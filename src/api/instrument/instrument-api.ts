import { Request, Response } from "express";
import { validateJSONSchemaObject } from "../../middleware/validators/ajv-validator";
import { instrumentSearchRequestQueryParamsSchema } from "./instrument-api.schema";
import { getPaginationOptions } from "../../utils/pagination";
import { createGetArrayResponse } from "../../utils/http-response-factory";
import { ErrorResponse } from "../../utils/shared-types";
import { InstrumentSearchRequestQueryParams, InstrumentSearchResponse } from "./instrument-api.types";
import { searchInstrument } from "./instrument";
import { isErrorResult } from "../../utils/exceptions";

export const handleSearchInstrument = async (req: Request, res: Response):
 Promise<Response<InstrumentSearchResponse> | Response<ErrorResponse>> => {
    const { pageOffset, pageLimit, ...query } =
        validateJSONSchemaObject<InstrumentSearchRequestQueryParams>(
            instrumentSearchRequestQueryParamsSchema,
            req.query
        );

    const pagination = getPaginationOptions({
        pageLimit: pageLimit,
        pageOffset: pageOffset,
    });
    const items = await searchInstrument(query, pagination);
    if(isErrorResult(items)){
        return createGetArrayResponse(res, items);
    }
    const result = items.items.map((item) => {
        const latestMarketData = item.marketdata[0];
        return {
            ...item,
            marketdata: {
                close: latestMarketData?.close?.toNumber() ?? null,
                previousclose: latestMarketData?.previousclose?.toNumber() ?? null,
                date: latestMarketData?.date?.toISOString() ?? null,
            }
        };
    });

    return createGetArrayResponse<
  InstrumentSearchResponse["items"][number]
>(
  res,
  { ...items, items: result },
  { pagination }
);
}