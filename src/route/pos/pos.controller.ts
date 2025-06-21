import type { Context } from "hono";
import { checkOutPosProduct, getPosProducts } from "./pos.model.js";

export const getPosProductsController = async (c: Context) => {
  try {
    const { take, skip } = c.get("params");

    const products = await getPosProducts(take, skip);

    return c.json(products);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
};

export const addPosProductController = async (c: Context) => {
  try {
    const { total_amount, cartItems } = c.get("params");

    const posProduct = await checkOutPosProduct(total_amount, cartItems);

    return c.json(posProduct);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
};
