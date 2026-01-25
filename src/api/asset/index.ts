import Router from "express-promise-router";
const router = Router();

router.get(
    "/",
    handleSearchAsset
);

export { router };