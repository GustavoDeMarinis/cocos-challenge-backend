import { FromSchema } from "json-schema-to-ts";
import { CommonDeserializationOptions } from "../../utils/schema.types";
import { instrumentSearchRequestQueryParamsSchema, instrumentSearchResponseSchema } from "./instrument-api.schema";

export type InstrumentSearchRequestQueryParams = FromSchema<typeof instrumentSearchRequestQueryParamsSchema>;

export type InstrumentSearchResponse = FromSchema<typeof instrumentSearchResponseSchema, CommonDeserializationOptions>;
