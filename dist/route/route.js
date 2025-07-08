import { Hono } from "hono";
import { checkoutProtectionMiddleware, protectionMiddleware, } from "../middleware/protection.middleware.js";
import address from "./address/address.route.js";
import auth from "./auth/auth.route.js";
import cart from "./cart/cart.route.js";
import dashboard from "./dashboard/dashboard.route.js";
import email from "./email/email.route.js";
import newsletter from "./newsletter/newsletter.route.js";
import order from "./order/order.route.js";
import payment from "./payment/payment.route.js";
import pos from "./pos/pos.route.js";
import product from "./product/product.route.js";
import publicRoutes from "./public/public.routes.js";
import reseller from "./reseller/reseller.route.js";
import user from "./user/user.route.js";
import webhook from "./webhook/webhook.route.js";
import withdraw from "./withdraw/withdraw.route.js";
const app = new Hono();
app.route("/auth", auth);
// User
app.use("/user/*", protectionMiddleware);
app.route("/user", user);
// Cart
app.route("/cart", cart);
// Payment
app.use("/payment/*", checkoutProtectionMiddleware);
app.route("/payment", payment);
// Orders
app.use("/orders/*", protectionMiddleware);
app.route("/orders", order);
// Address
app.use("/address/*", protectionMiddleware);
app.route("/address", address);
// Product
app.use("/product/*", protectionMiddleware);
app.route("/product", product);
// Reseller
app.use("/reseller/*", protectionMiddleware);
app.route("/reseller", reseller);
// Withdraw
app.use("/withdraw/*", protectionMiddleware);
app.route("/withdraw", withdraw);
// Dashboard
app.use("/dashboard/*", protectionMiddleware);
app.route("/dashboard", dashboard);
// POS
app.use("/pos/*", protectionMiddleware);
app.route("/pos", pos);
// Public
app.route("/publicRoutes", publicRoutes);
// Newsletter
app.route("/newsletter", newsletter);
// Email
app.route("/email", email);
// Webhook
app.route("/webhooks", webhook);
app.get("/", (c) => c.text("This is the api endpoint"));
export default app;
