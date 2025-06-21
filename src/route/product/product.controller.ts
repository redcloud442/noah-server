import { Prisma } from "@prisma/client";
import type { Context } from "hono";
import {
  productCollectionModel,
  productCollectionSlugModel,
  productCreateModel,
  productGetAllProductModel,
  productGetCategoriesModel,
  productPublicModel,
  productSetFeaturedProductModel,
  productVariantCreateModel,
  productVariantUpdateModel,
} from "./product.model.js";

export const productGetController = async (c: Context) => {
  try {
    const params = c.get("params");

    const products = await productCollectionModel(params);
    return c.json(products, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json(
        {
          message: "Internal server error",
          error: "Internal server error",
        },
        500
      );
    } else if (error instanceof Error) {
      return c.json(
        {
          message: "Internal server error",
          error: error.message,
        },
        500
      );
    }
  }
  [];
};

export const productCreateController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await productCreateModel(params);

    return c.json(data, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json({ message: "Internal server error" }, 500);
    }
  }
};

export const productVariantCreateController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await productVariantCreateModel(params);

    return c.json(data, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json({ message: "Internal server error" }, 500);
    } else if (error instanceof Error) {
      return c.json({ message: "Internal server error" }, 500);
    }
  }
};

export const productCollectionSlugController = async (c: Context) => {
  try {
    const params = c.get("params");

    const { data, count } = await productCollectionSlugModel(params);

    return c.json({ data, count }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json({ message: "Internal server error" }, 500);
    }
  }
};

export const productGetCategoriesController = async (c: Context) => {
  try {
    const data = await productGetCategoriesModel();

    return c.json(data, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json({ message: "Internal server error" }, 500);
    }
  }
};

export const productGetAllProductController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await productGetAllProductModel(params);

    return c.json(data, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json({ message: "Internal server error" }, 500);
    } else if (error instanceof Error) {
      return c.json({ message: "Internal server error" }, 500);
    }
  }
};

export const productVariantUpdateController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await productVariantUpdateModel(params);

    return c.json(data, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const productSetFeaturedProductController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await productSetFeaturedProductModel(params);

    return c.json(data, 200);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const productPublicController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await productPublicModel(params);

    return c.json(data, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return c.json({ message: "Internal server error" }, 500);
    } else if (error instanceof Error) {
      return c.json({ message: "Internal server error" }, 500);
    }
  }
};
