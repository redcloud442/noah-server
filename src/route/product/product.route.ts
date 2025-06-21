import { Hono } from "hono";
import {
  productCollectionSlugController,
  productCreateController,
  productGetAllProductController,
  productGetCategoriesController,
  productGetController,
  productSetFeaturedProductController,
  productVariantCreateController,
  productVariantUpdateController,
} from "./product.controller.js";
import {
  productCollectionMiddleware,
  productCollectionSlugMiddleware,
  productCollectionsPostMiddleware,
  productCreateMiddleware,
  productGetAllProductMiddleware,
  productGetCategoriesMiddleware,
  productSetFeaturedProductMiddleware,
  productUpdateMiddleware,
} from "./product.middleware.js";

const product = new Hono();

product.get("/collections", productCollectionMiddleware, productGetController);

product.post(
  "/collections",
  productCollectionsPostMiddleware,
  productCreateController
);

product.post(
  "/collections/category",
  productCollectionSlugMiddleware,
  productCollectionSlugController
);

product.get(
  "/categories",
  productGetCategoriesMiddleware,
  productGetCategoriesController
);

product.post("/", productCreateMiddleware, productVariantCreateController);

product.put("/", productUpdateMiddleware, productVariantUpdateController);

product.post(
  "/all-product",
  productGetAllProductMiddleware,
  productGetAllProductController
);

product.post(
  "/set-featured",
  productSetFeaturedProductMiddleware,
  productSetFeaturedProductController
);

export default product;
