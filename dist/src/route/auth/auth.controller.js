import { registerModel } from "./auth.model.js";
export const registerController = async (c) => {
    try {
        const { email, password } = await c.req.json();
        await registerModel({ email, password });
        return c.json({ message: "User created" }, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
