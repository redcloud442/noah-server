import { Prisma } from "@prisma/client";
import { productGetAllProductCollectionsModel } from "../product/product.model.js";
import { productGetAllProductOptionsModel, productPublicModel, } from "./public.model.js";
export const productPublicController = async (c) => {
    try {
        const params = c.get("params");
        const data = await productPublicModel(params);
        return c.json(data, 200);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return c.json({ message: "Internal server error" }, 500);
        }
        else if (error instanceof Error) {
            return c.json({ message: "Internal server error" }, 500);
        }
    }
};
export const productGetAllProductCollectionsController = async (c) => {
    try {
        const data = await productGetAllProductCollectionsModel();
        return c.json(data, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
export const productGetAllProductOptionsController = async (c) => {
    try {
        const data = await productGetAllProductOptionsModel();
        return c.json(data, 200);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
