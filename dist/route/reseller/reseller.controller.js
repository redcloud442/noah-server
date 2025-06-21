import { resellerDashboardModel, resellerGetListModel, resellerOrdersModel, } from "./reseller.model.js";
export const resellerController = async (c) => {
    try {
        const user = c.get("user");
        const { take, skip } = c.get("params");
        const resellers = await resellerGetListModel({
            take,
            skip,
            teamMemberId: user.user_metadata.teamMemberId,
        });
        return c.json(resellers);
    }
    catch (error) {
        return c.json({
            message: "Internal server error",
            error: error,
        }, 500);
    }
};
export const resellerDashboardController = async (c) => {
    try {
        const user = c.get("user");
        const reseller = await resellerDashboardModel({
            resellerId: user.user_metadata.resellerId,
        });
        return c.json(reseller);
    }
    catch (error) {
        return c.json({
            message: "Internal server error",
            error: error,
        }, 500);
    }
};
export const resellerOrdersController = async (c) => {
    try {
        const user = c.get("user");
        const { take, skip, search, sortDirection, columnAccessor, dateFilter } = c.get("params");
        const orders = await resellerOrdersModel({
            resellerId: user.user_metadata.resellerId,
            take,
            skip,
            search,
            sortDirection,
            columnAccessor,
            dateFilter,
        });
        return c.json(orders);
    }
    catch (error) {
        return c.json({
            message: "Internal server error",
            error: error,
        }, 500);
    }
};
