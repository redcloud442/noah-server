import { Hono } from "hono";
import auth from "./auth/auth.route.js";
const app = new Hono();
app.route("/auth", auth);
app.get("/", (c) => c.text("This is the api endpoint"));
export default app;
