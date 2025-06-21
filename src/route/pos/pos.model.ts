import { OrderStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import prisma from "../../utils/prisma.js";

export const getPosProducts = async (take: number, skip: number) => {
  const offset = (skip - 1) * take;

  const products = await prisma.product_variant_table.findMany({
    where: {
      product_variant_is_deleted: false,
    },
    include: {
      product_variant_product: {
        select: {
          product_id: true,
          product_name: true,
          product_category_id: true,
          product_price: true,
        },
      },
      variant_sample_images: {
        select: {
          variant_sample_image_image_url: true,
        },
        take: 1,
      },
      variant_sizes: {
        select: {
          variant_size_id: true,
          variant_size_value: true,
          variant_size_quantity: true,
          variant_size_variant_id: true,
        },
      },
    },
    take,
    skip,
  });

  const count = await prisma.product_variant_table.count({
    where: {
      product_variant_is_deleted: false,
    },
  });

  return { products, count };
};

export const checkOutPosProduct = async (
  total_amount: number,
  cartItems: {
    product_variant_id: string;
    product_quantity: number;
    product_variant_size: string;
    product_variant_product: string;
  }[]
) => {
  const variantIds = cartItems.map((item) => item.product_variant_id);
  const sizes = cartItems.map((item) => item.product_variant_size);
  const quantities = cartItems.map((item) => item.product_quantity);

  await prisma.$transaction(async (tx) => {
    const placeholders = variantIds.map((_, i) => `$${i + 1}::uuid`).join(", ");

    const lockedStock = await tx.$queryRawUnsafe<
      {
        product_variant_id: string;
        variant_size_value: string;
        variant_size_quantity: number;
      }[]
    >(
      `
  SELECT
    pvt.product_variant_id,
    vs.variant_size_value,
    vs.variant_size_quantity
  FROM product_schema.product_variant_table pvt
  JOIN product_schema.variant_size_table vs
    ON vs.variant_size_variant_id = pvt.product_variant_id
  WHERE pvt.product_variant_id IN (${placeholders})
  FOR UPDATE
  `,
      ...variantIds
    );

    const productStockMap = new Map<string, Map<string, number>>();

    for (const product of lockedStock) {
      if (!productStockMap.has(product.product_variant_id)) {
        productStockMap.set(product.product_variant_id, new Map());
      }
      productStockMap
        .get(product.product_variant_id)!
        .set(product.variant_size_value, product.variant_size_quantity);
    }

    // Validate
    for (const item of cartItems) {
      const sizeMap = productStockMap.get(item.product_variant_id);
      const sizeKey = item.product_variant_size ?? "";
      const availableStock = sizeMap?.get(sizeKey);

      if (availableStock === undefined) {
        throw new Error(
          `Product variant ${item.product_variant_id} with size ${sizeKey} not found.`
        );
      }

      if (availableStock < item.product_quantity) {
        throw new Error(
          `Insufficient stock for product ${item.product_variant_id} size ${sizeKey}.`
        );
      }
    }
    const id = uuidv4();

    await tx.order_table.create({
      data: {
        order_number: `CASH-${id}`,
        order_payment_id: `CASH-${id}`,
        order_payment_method_id: `CASH-${id}`,
        order_email: "CASH PAYMENT",
        order_first_name: "CASH PAYMENT",
        order_last_name: "CASH PAYMENT",
        order_payment_method: "CASH",
        order_address: "CASH PAYMENT",
        order_city: "CASH PAYMENT",
        order_state: "CASH PAYMENT",
        order_barangay: "CASH PAYMENT",
        order_postal_code: "CASH PAYMENT",
        order_phone: "CASH PAYMENT",
        order_status: OrderStatus.PAID,
        order_total: total_amount,
        order_team_id: "16dcbf9a-1904-43f7-a98a-060f6903661d",
        order_items: {
          createMany: {
            data: cartItems.map((item) => ({
              product_variant_id: item.product_variant_id,
              size: item.product_variant_size,
              quantity: item.product_quantity,
            })),
          },
        },
      },
    });

    await tx.variant_size_table.updateMany({
      where: {
        variant_size_variant_id: { in: variantIds },
        variant_size_value: { in: sizes },
      },
      data: {
        variant_size_quantity: {
          decrement: quantities.reduce((acc, curr) => acc + curr, 0),
        },
      },
    });
  });

  return { message: "POS Product added successfully" };
};
