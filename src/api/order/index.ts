import Router from "express-promise-router";
import { handlePostOrder } from "./order-api";
const router = Router();

router.post(
    "/",
    handlePostOrder
);

export { router };