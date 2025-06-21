import { createResellerRequestModel, getUserListModel, getUserListResellerModel, getUserModel, userPatchModel, verifyResellerCodeModel, } from "./user.model.js";
export const getUserController = async (c) => {
    try {
        const user = c.get("user");
        const userData = await getUserModel({
            userId: user.id,
            activeTeamId: user.activeTeamId,
            role: user.user_metadata.role,
        });
        return c.json(userData);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const getUserListController = async (c) => {
    try {
        const params = c.get("params");
        const userData = await getUserListModel(params);
        return c.json(userData, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const getUserListResellerController = async (c) => {
    try {
        const params = c.get("params");
        const userData = await getUserListResellerModel(params);
        return c.json(userData, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const userResellerRequestController = async (c) => {
    try {
        const user = c.get("user");
        const resellerRequest = await createResellerRequestModel({
            userId: user.id,
            userEmail: user.email,
        });
        return c.json(resellerRequest, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const userVerifyResellerCodeController = async (c) => {
    try {
        const user = c.get("user");
        const params = c.get("params");
        const resellerRequest = await verifyResellerCodeModel({
            userId: user.id,
            memberId: user.user_metadata.teamMemberId,
            userEmail: user.email,
            otp: params.otp,
        });
        return c.json(resellerRequest, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({ message: error.message }, 400);
        }
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const userPatchController = async (c) => {
    try {
        const params = c.get("params");
        await userPatchModel({
            id: params.userId,
            type: params.type,
            role: params.role,
        });
        return c.json("User updated successfully", 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
