import { cartCheckoutModel, cartDeleteModel, cartGetModel, cartGetQuantityModel, cartPostModel, cartPutModel, } from "./cart.model.js";
export const cartGetController = async (c) => {
    try {
        const user = c.get("user");
        const cart = await cartGetModel(user, false);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const cartGetCheckedOutController = async (c) => {
    try {
        const user = c.get("user");
        const cart = await cartGetModel(user, true);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const cartPostController = async (c) => {
    try {
        const params = c.get("params");
        const user = c.get("user");
        const cart = await cartPostModel(params, user);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const cartDeleteController = async (c) => {
    try {
        const { id } = c.get("params");
        const cart = await cartDeleteModel(id);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const cartPutController = async (c) => {
    try {
        const { id, product_quantity } = c.get("params");
        const user = c.get("user");
        const cart = await cartPutModel(id, product_quantity);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const cartGetQuantityController = async (c) => {
    try {
        const params = c.get("params");
        const cart = await cartGetQuantityModel(params);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const cartCheckoutController = async (c) => {
    try {
        const params = c.get("params");
        const user = c.get("user");
        const { items, cartItems } = params;
        const cart = await cartCheckoutModel(items, cartItems, user);
        return c.json(cart, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
