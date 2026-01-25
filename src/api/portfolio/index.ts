import Router from "express-promise-router";
import { handleGetPortfolio } from "./portfolio-api";
const router = Router();

router.get(
    "/:userId",
    handleGetPortfolio
);

export { router };