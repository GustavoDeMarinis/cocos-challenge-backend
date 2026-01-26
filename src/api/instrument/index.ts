import Router from "express-promise-router";
import { handleSearchInstrument } from "./instrument-api";
const router = Router();

router.get(
    "/",
    handleSearchInstrument
);

export { router };