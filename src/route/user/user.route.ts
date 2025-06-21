import { Hono } from "hono";
import {
  getUserController,
  getUserListController,
  getUserListResellerController,
  userChangePasswordController,
  userGenerateLoginLinkController,
  userPatchController,
  userResellerRequestController,
  userVerifyResellerCodeController,
} from "./user.controller.js";
import {
  userChangePasswordMiddleware,
  userGenerateLoginLinkMiddleware,
  userGetMiddleware,
  userPatchMiddleware,
  userPostMiddleware,
  userResellerRequestMiddleware,
  userVerifyResellerCodeMiddleware,
} from "./user.middleware.js";

const user = new Hono();

user.get("/", userGetMiddleware, getUserController);

user.post("/", userPostMiddleware, getUserListController);

user.patch("/:id", userPatchMiddleware, userPatchController);

user.post("/reseller", userPostMiddleware, getUserListResellerController);

user.post(
  "/reseller-request",
  userResellerRequestMiddleware,
  userResellerRequestController
);

user.post(
  "/verify-reseller-code",
  userVerifyResellerCodeMiddleware,
  userVerifyResellerCodeController
);

user.post(
  "/change-password",
  userChangePasswordMiddleware,
  userChangePasswordController
);

user.post(
  "/generate-link",
  userGenerateLoginLinkMiddleware,
  userGenerateLoginLinkController
);

export default user;
