import { Request, Response } from "express";
import { validateJSONSchemaObject } from "../../utils/validateJSONSchemaObject";
import { assetSearchRequestQueryParamsSchema } from "./asset-api.schema";
import { getPaginationOptions } from "../../utils/pagination";
import { createGetArrayResponse } from "../../utils/http-response-factory";

export const handleSearchAsset = async (req: Request, res: Response) => {
    const { pageOffset, pageLimit, sort, ...query } =
        validateJSONSchemaObject<AssetSearchRequestQueryParams>(
            assetSearchRequestQueryParamsSchema,
            req.query
        );

    const pagination = getPaginationOptions({
        pageLimit: pageLimit,
        pageOffset: pageOffset,
    });
    const result = await searchAsset(query, pagination, sort);
    return createGetArrayResponse<AssetSearchResult>(res, result, { pagination });
}