import { instrumentSearchRequestQueryParamsSchema, instrumentSearchResponseSchema } from "../../api/instrument/instrument-api.schema";
import { commonErrorsResponseSchema } from "../error.swagger";

const searchInstrument = {
    tags: ["Instrument"],
    description:
        "## Search Instruments\n" +
        "Search for tradable instruments (stocks, assets) by name or ticker symbol.\n\n" +
        "### Query Parameters\n" +
        "- **name**: Filter instruments by name (case-insensitive partial match)\n" +
        "- **ticker**: Filter instruments by ticker symbol (case-insensitive partial match)\n" +
        "- **pageOffset**: Pagination offset (default: 0)\n" +
        "- **pageLimit**: Number of results per page (default: 10, max: 100)\n\n" +
        "### Response\n" +
        "Returns a paginated list of instruments with their latest market data.\n\n" +
        "**Note**: Currency instruments (type: MONEDA) are excluded from search results.",
    operationId: "searchInstrument",
    parameters: [
        {
            in: "query",
            name: "name",
            required: false,
            schema: instrumentSearchRequestQueryParamsSchema.properties.name,
            description: "Filter by instrument name (case-insensitive partial match)",
        },
        {
            in: "query",
            name: "ticker",
            required: false,
            schema: instrumentSearchRequestQueryParamsSchema.properties.ticker,
            description: "Filter by ticker symbol (case-insensitive partial match)",
        },
        {
            in: "query",
            name: "pageOffset",
            required: false,
            schema: instrumentSearchRequestQueryParamsSchema.properties.pageOffset,
            description: instrumentSearchRequestQueryParamsSchema.properties.pageOffset.description,
        },
        {
            in: "query",
            name: "pageLimit",
            required: false,
            schema: instrumentSearchRequestQueryParamsSchema.properties.pageLimit,
            description: instrumentSearchRequestQueryParamsSchema.properties.pageLimit.description,
        },
    ],
    responses: {
        "200": {
            description: "Successful instrument search",
            content: {
                "application/json": {
                    schema: instrumentSearchResponseSchema,
                },
            },
        },
        ...commonErrorsResponseSchema,
    },
};

export const instrumentPaths = {
    "/instrument": {
        get: searchInstrument,
    },
};
