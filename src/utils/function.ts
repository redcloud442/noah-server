export const sendErrorResponse = (message: string, status: number) =>
  Response.json({ error: message }, { status });

export const sendSuccessResponse = (message: string, status: number) =>
  Response.json({ message: message }, { status });

export const getClientIP = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  request.headers.get("cf-connecting-ip") ||
  "unknown";

export const slugifyVariant = (name: string) => {
  return `${name}`
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};
