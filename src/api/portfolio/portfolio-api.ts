import { validateJSONSchemaObject } from "../../middleware/validators/ajv-validator";
import { createGetResponse } from "../../utils/http-response-factory";
import { ErrorResponse } from "../../utils/shared-types";
import { Request, Response } from "express";
import { getPortfolio } from "./portfolio";
import { portfolioRequestParamsSchema } from "./portfolio-api.schema";
import { PortfolioGetResponse, PortfolioRequestParams } from "./portfolio-api.types";

export const handleGetPortfolio = async (
    req: Request,
    res: Response
): Promise<Response<PortfolioGetResponse> | Response<ErrorResponse>> => {
    const { userId } = validateJSONSchemaObject<PortfolioRequestParams>(
        portfolioRequestParamsSchema,
        req.params
    );

    const result = await getPortfolio({ id: userId });
    return createGetResponse<any>(res, result);
};