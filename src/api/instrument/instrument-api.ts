import { Request, Response } from "express";
import { validateJSONSchemaObject } from "../../middleware/validators/ajv-validator";
import { instrumentSearchRequestQueryParamsSchema } from "./instrument-api.schema";
import { getPaginationOptions } from "../../utils/pagination";
import { createGetArrayResponse } from "../../utils/http-response-factory";
import { ErrorResponse } from "../../utils/shared-types";
import { InstrumentSearchRequestQueryParams, InstrumentSearchResponse } from "./instrument-api.types";
import { InstrumentResult, searchInstrument } from "./instrument";
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
    const result = await searchInstrument(query, pagination);


    return createGetArrayResponse<InstrumentResult>(res, result, { pagination });
}