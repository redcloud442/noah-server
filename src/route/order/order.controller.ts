import type { Context } from "hono";
import {
  orderGetItemsModel,
  orderGetListModel,
  orderGetModel,
  orderPutModel,
} from "./order.model.js";

export const orderGetController = async (c: Context) => {
  try {
    const user = c.get("user");
    const params = c.get("params");
    const orders = await orderGetModel({ userId: user.id, ...params });
    return c.json(orders);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const orderGetItemsController = async (c: Context) => {
  try {
    const params = c.get("params");

    const orderItems = await orderGetItemsModel({
      orderNumber: params.orderNumber,
    });

    return c.json(orderItems, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const orderGetListController = async (c: Context) => {
  try {
    const params = c.get("params");

    const orders = await orderGetListModel({ ...params });

    return c.json(orders);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const orderPutController = async (c: Context) => {
  try {
    const params = c.get("params");

    const orders = await orderPutModel({ ...params });

    return c.json(orders);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};
