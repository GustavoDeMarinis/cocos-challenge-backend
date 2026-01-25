import { portfolioGetResponseSchema, portfolioRequestParamsSchema } from "../../api/portfolio/portfolio-api.schema";
import { commonErrorsResponseSchema } from "../error.swagger";

const getPortfolio = {
    tags: ["Portfolio"],
    description:
        "## Get Portfolio\n" +
        "Returns a consolidated view of a user's account, including total account value, available funds, and a list of owned assets (positions) with performance metrics.\n\n" +
        "### Calculation Logic\n" +
        "- **Market Value per Position**: `quantity * latestClosePrice`\n" +
        "- **Total Account Value**: `available_cash + sum(market value of all positions)`\n" +
        "- **Total Return %**: `((marketValue - totalInvested) / totalInvested) * 100`\n\n" +
        "**Note**: Short positions (quantity < 0) are excluded from the positions list but included in the total account value.",
    operationId: "getPortfolio",
    parameters: [
        {
            in: "path",
            name: "userId",
            required: true,
            schema: portfolioRequestParamsSchema.properties.userId,
            description: portfolioRequestParamsSchema.properties.userId.description,
        },
    ],
    responses: {
        "200": {
            description: "Successful Portfolio retrieval",
            content: {
                "application/json": {
                    schema: portfolioGetResponseSchema,
                },
            },
        },
        ...commonErrorsResponseSchema,
    },
};

export const portfolioPaths = {
    "/portfolio/{userId}": {
        get: getPortfolio,
    },
};
