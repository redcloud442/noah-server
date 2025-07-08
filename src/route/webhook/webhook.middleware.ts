import { createHmac, timingSafeEqual } from "crypto";
import type { Context, Next } from "hono";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!; // never expose this

const FIVE_MINUTES = 300; // optional replay-attack window

export const webhookMiddleware = async (c: Context, next: Next) => {
  const signatureHeader = c.req.header("Paymongo-Signature");
  if (!signatureHeader) return c.json({ error: "Unauthorized" }, 401);

  // 1. Parse header → { t, te, li }
  const sigParts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.trim().split("="))
  );
  const { t: timestamp, te, li } = sigParts;

  // 2. Basic validation
  const suppliedSignature = process.env.NODE_ENV === "production" ? li : te;
  if (!timestamp || !suppliedSignature)
    return c.json({ error: "Invalid signature format" }, 401);

  // (optional) Reject stale requests
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (Math.abs(age) > FIVE_MINUTES)
    return c.json({ error: "Signature timestamp out of range" }, 401);

  // 3. Build the payload exactly as PayMongo does
  const rawBody = await c.req.raw.arrayBuffer(); // ⟵ MUST be raw bytes
  const signaturePayload = `${timestamp}.${Buffer.from(rawBody).toString()}`;

  // 4. Compute our own HMAC (hex)
  const computed = createHmac("sha256", WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest("hex");

  // 5. Constant-time compare (convert *both* from hex → bytes)
  const isValid =
    suppliedSignature.length === computed.length && // lengths must match
    timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(suppliedSignature, "hex")
    );

  if (!isValid) return c.json({ error: "Invalid signature" }, 401);

  // 6. Expose the parsed body to downstream handlers
  c.set("body", JSON.parse(Buffer.from(rawBody).toString()));
  await next();
};
