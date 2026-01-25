import { FromSchema } from "json-schema-to-ts";
import { CommonDeserializationOptions } from "../../utils/schema.types";
import { portfolioGetResponseSchema, portfolioRequestParamsSchema } from "./portfolio-api.schema";

export type PortfolioRequestParams = FromSchema<typeof portfolioRequestParamsSchema>;

export type PortfolioGetResponse = FromSchema<typeof portfolioGetResponseSchema>;


