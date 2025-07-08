import { createHmac, timingSafeEqual } from "crypto";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
export const webhookMiddleware = async (c, next) => {
    const signatureHeader = c.req.header("Paymongo-Signature");
    if (!signatureHeader) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const parts = Object.fromEntries(signatureHeader
        .split(",")
        .map((part) => part.trim().split("="))
        .filter(([key, value]) => key && value));
    const timestamp = parts["t"];
    const testSignature = parts["te"];
    const liveSignature = parts["li"];
    if (!timestamp || (!testSignature && !liveSignature)) {
        return c.json({ error: "Invalid signature format" }, 401);
    }
    const rawBody = await c.req.raw.arrayBuffer();
    const rawBodyBuffer = Buffer.from(rawBody);
    const signaturePayload = `${timestamp}.${rawBodyBuffer.toString()}`;
    const computedSignature = createHmac("sha256", WEBHOOK_SECRET)
        .update(signaturePayload)
        .digest("hex");
    const isValid = process.env.NODE_ENV === "production"
        ? timingSafeEqual(Buffer.from(computedSignature), Buffer.from(liveSignature ?? ""))
        : timingSafeEqual(Buffer.from(computedSignature), Buffer.from(testSignature ?? ""));
    if (!isValid) {
        return c.json({ error: "Invalid signature" }, 401);
    }
    c.set("body", JSON.parse(rawBodyBuffer.toString()));
    await next();
};
