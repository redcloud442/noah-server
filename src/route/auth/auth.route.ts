import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import {
  checkoutMiddleware,
  protectionMiddleware,
} from "../../middleware/protection.middleware.js";
import {
  authCallbackController,
  authLoginController,
  authLoginResellerController,
  authLogoutController,
  authRegisterController,
  authSaveCartController,
  authVerifyTokenController,
  createCheckoutTokenController,
  verifyCheckoutTokenController,
} from "./auth.controller.js";
import {
  authCallbackMiddleware,
  authLoginMiddleware,
  authLoginResellerMiddleware,
  authRegisterMiddleware,
  authSaveCartMiddleware,
  createCheckoutTokenMiddleware,
  deleteCheckoutTokenMiddleware,
  handleLogoutMiddleware,
  verifyCheckoutTokenMiddleware,
} from "./auth.middleware.js";
const auth = new Hono();

auth.post("/login", authLoginMiddleware, authLoginController);

auth.post(
  "/login/reseller",
  authLoginResellerMiddleware,
  authLoginResellerController
);

auth.post("/callback", authCallbackMiddleware, authCallbackController);

auth.post(
  "/save-cart",
  protectionMiddleware,
  authSaveCartMiddleware,
  authSaveCartController
);

auth.post(
  "/register",
  protectionMiddleware,
  authRegisterMiddleware,
  authRegisterController
);

auth.post("/logout", handleLogoutMiddleware, authLogoutController);

auth.get("/user", protectionMiddleware, authVerifyTokenController);

auth.post(
  "/checkout-token",
  checkoutMiddleware,
  createCheckoutTokenMiddleware,
  createCheckoutTokenController
);

auth.get(
  "/verify-checkout-token",
  verifyCheckoutTokenMiddleware,
  verifyCheckoutTokenController
);

auth.post("/delete-checkout-token", deleteCheckoutTokenMiddleware, (c) => {
  deleteCookie(c, "checkout_token");
  return c.json({ message: "Checkout token deleted" }, 200);
});

export default auth;
