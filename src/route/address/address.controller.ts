import type { Context } from "hono";
import { sendErrorResponse } from "../../utils/function.js";
import {
  addressCreateModel,
  addressDeleteModel,
  addressGetModel,
  addressSetDefaultModel,
  addressUpdateModel,
} from "./address.model.js";

export const addressGetController = async (c: Context) => {
  try {
    const { take, skip } = c.get("params");
    const user = c.get("user");

    const data = await addressGetModel({
      take,
      skip,
      user,
    });

    return c.json(data, 200);
  } catch (error) {
    return sendErrorResponse("Internal server error", 500);
  }
};

export const addressCreateController = async (c: Context) => {
  try {
    const params = c.get("params");
    const user = c.get("user");

    await addressCreateModel({
      user,
      addressData: params,
    });

    return c.json("Address created successfully", 200);
  } catch (error) {
    return sendErrorResponse("Internal server error", 500);
  }
};

export const addressUpdateController = async (c: Context) => {
  try {
    const params = c.get("params");

    const { id } = c.req.param();

    await addressUpdateModel({
      addressData: params,
      id,
    });

    return c.json("Address updated successfully", 200);
  } catch (error) {
    return sendErrorResponse("Internal server error", 500);
  }
};

export const addressSetDefaultController = async (c: Context) => {
  try {
    const params = c.get("params");
    const user = c.get("user");

    await addressSetDefaultModel({
      id: params,
      userId: user.id,
    });

    return c.json("Set as default successfully", 200);
  } catch (error) {
    return sendErrorResponse("Internal server error", 500);
  }
};

export const addressDeleteController = async (c: Context) => {
  try {
    const params = c.get("params");

    await addressDeleteModel({
      id: params,
    });

    return c.json("Address deleted successfully", 200);
  } catch (error) {
    return sendErrorResponse("Internal server error", 500);
  }
};
