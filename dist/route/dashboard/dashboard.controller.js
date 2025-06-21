import { dashboardModel } from "./dashboard.model.js";
export const dashboardController = async (c) => {
    try {
        const params = c.get("params");
        const dashboard = await dashboardModel(params);
        return c.json(dashboard);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
