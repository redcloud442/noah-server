import type { Context } from "hono";
import {
  createResellerRequestModel,
  getUserListModel,
  getUserListResellerModel,
  getUserModel,
  userChangePasswordModel,
  userGenerateLoginLinkModel,
  userPatchModel,
  verifyResellerCodeModel,
} from "./user.model.js";

export const getUserController = async (c: Context) => {
  try {
    const user = c.get("user");

    const userData = await getUserModel({
      userId: user.id,
      activeTeamId: user.activeTeamId,
      role: user.user_metadata.role,
    });

    return c.json(userData);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const getUserListController = async (c: Context) => {
  try {
    const params = c.get("params");

    const userData = await getUserListModel(params);

    return c.json(userData, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const getUserListResellerController = async (c: Context) => {
  try {
    const params = c.get("params");

    const userData = await getUserListResellerModel(params);

    return c.json(userData, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const userResellerRequestController = async (c: Context) => {
  try {
    const user = c.get("user");

    const resellerRequest = await createResellerRequestModel({
      userId: user.id,
      userEmail: user.email,
    });

    return c.json(resellerRequest, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const userVerifyResellerCodeController = async (c: Context) => {
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
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, 400);
    }

    return c.json({ message: "Internal server error" }, 500);
  }
};

export const userPatchController = async (c: Context) => {
  try {
    const params = c.get("params");
    await userPatchModel({
      id: params.userId,
      type: params.type,
      role: params.role,
    });

    return c.json("User updated successfully", 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const userChangePasswordController = async (c: Context) => {
  try {
    const params = c.get("params");
    const userChangePassword = await userChangePasswordModel({
      userId: params.userId,
      password: params.password,
    });

    return c.json(userChangePassword, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const userGenerateLoginLinkController = async (c: Context) => {
  try {
    const params = c.get("params");
    const userGenerateLoginLink = await userGenerateLoginLinkModel({
      email: params.email,
    });

    return c.json(userGenerateLoginLink, 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, 400);
    }

    return c.json({ message: "Internal server error" }, 500);
  }
};
