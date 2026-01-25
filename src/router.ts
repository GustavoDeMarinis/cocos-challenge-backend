import Router from "express-promise-router";
import swaggerUi from "swagger-ui-express";
/* import { router as userRouter } from "./api/user"; */
import { router as portfolioRouter } from "./api/portfolio";
import { router as assetRouter } from "./api/asset";
import { apiDocsMiddleware, swaggerDocument } from "./swagger/config";
const router = Router();

router.use("/api-docs", apiDocsMiddleware, swaggerUi.serve);
router.get("/api-docs", apiDocsMiddleware, swaggerUi.setup(swaggerDocument));

router.use("/portfolio", portfolioRouter);
router.use("/asset", assetRouter);
export default router;
