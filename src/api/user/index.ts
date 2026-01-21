import Router from "express-promise-router";
import {
  handleDeleteUser,
  handleGetUser,
  handlePatchUser,
  handleSearchUser,
} from "./user-api";


const router = Router();

router.get(
  "/",
  handleSearchUser
);

router.get(
  "/:userId",
  handleGetUser
);

router.patch(
  "/:userId",
  handlePatchUser
);

router.delete(
  "/:userId",
  handleDeleteUser
);

export { router };
