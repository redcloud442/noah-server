import { Hono } from "hono";
import {
  productGetAllProductCollectionsController,
  productGetAllProductOptionsController,
  productPublicController,
} from "./public.controller.js";
import {
  productGetAllProductCollectionsMiddleware,
  productGetAllProductOptionsMiddleware,
  productPublicMiddleware,
} from "./public.middleware.js";

const publicRoutes = new Hono();

publicRoutes.get(
  "/product-collections-all",
  productGetAllProductCollectionsMiddleware,
  productGetAllProductCollectionsController
);

publicRoutes.get(
  "/product-public",
  productPublicMiddleware,
  productPublicController
);

publicRoutes.get(
  "/product-options",
  productGetAllProductOptionsMiddleware,
  productGetAllProductOptionsController
);

export default publicRoutes;
