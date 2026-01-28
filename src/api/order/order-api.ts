import { Request, Response } from "express";

import { OrderPostRequestBody, OrderPostResponse } from "./order-api.types";
import { ErrorResponse } from "../../utils/shared-types";
import { validateJSONSchemaObject } from "../../middleware/validators/ajv-validator";
import { createPostResponse } from "../../utils/http-response-factory";
import { orderPostRequestBodySchema } from "./order-api.schema";
import { insertOrder, OrderResult } from "./order";


export const handlePostOrder = async (req: Request, res: Response): Promise<Response<OrderPostResponse> | Response<ErrorResponse>> => {
    const body = validateJSONSchemaObject<OrderPostRequestBody>(
        orderPostRequestBodySchema,
        req.body
    );
    const result = await insertOrder(body);

    return createPostResponse<OrderResult>(req, res, result);
}