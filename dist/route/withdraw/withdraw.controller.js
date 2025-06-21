import { withdrawalActionModel, withdrawalListModel, withdrawModel, } from "./withdraw.model.js";
export const withdrawController = async (c) => {
    try {
        const params = c.get("params");
        const user = c.get("user");
        const data = await withdrawModel(params, user.user_metadata.resellerId);
        return c.json(data, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const withdrawListController = async (c) => {
    try {
        const params = c.get("params");
        const data = await withdrawalListModel(params);
        return c.json(data, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const withdrawActionController = async (c) => {
    try {
        const params = c.get("params");
        const user = c.get("user");
        await withdrawalActionModel(params, user.user_metadata.resellerId);
        return c.json({ message: "Withdrawal action successful" }, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
