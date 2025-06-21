export const sendErrorResponse = (message, status) => Response.json({ error: message }, { status });
export const sendSuccessResponse = (message, status) => Response.json({ message: message }, { status });
export const getClientIP = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
