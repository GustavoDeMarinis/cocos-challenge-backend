import Router from "express-promise-router";
import swaggerUi from "swagger-ui-express";
import { router as userRouter } from "./api/user";

import { apiDocsMiddleware, swaggerDocument } from "./swagger/config";
const router = Router();

router.use("/api-docs", apiDocsMiddleware, swaggerUi.serve);
router.get("/api-docs", apiDocsMiddleware, swaggerUi.setup(swaggerDocument));

router.use("/user", userRouter);
export default router;
