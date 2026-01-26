import Router from "express-promise-router";
import swaggerUi from "swagger-ui-express";
import { router as portfolioRouter } from "./api/portfolio";
import { router as instrumentRouter } from "./api/instrument";
import { apiDocsMiddleware, swaggerDocument } from "./swagger/config";
const router = Router();

router.use("/api-docs", apiDocsMiddleware, swaggerUi.serve);
router.get("/api-docs", apiDocsMiddleware, swaggerUi.setup(swaggerDocument));

router.use("/portfolio", portfolioRouter);
router.use("/instrument", instrumentRouter);
export default router;
