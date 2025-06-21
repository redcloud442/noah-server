import type {
  typeCartCheckoutSchema,
  typeCartSchema,
} from "../../schema/schema.js";
import prisma from "../../utils/prisma.js";
import type { CartGetQuantityParams } from "../../utils/schema.js";

export const cartGetModel = async (user: any, toBeCheckedOut: boolean) => {
  const cart = await prisma.cart_table.findMany({
    where: {
      cart_user_id: user.id,
      cart_to_be_checked_out: toBeCheckedOut,
    },
    include: {
      cart_product_variant: {
        include: {
          product_variant_product: true,
          variant_sample_images: true,
        },
      },
    },
  });

  const productCart = cart.map((item) => ({
    cart_id: item.cart_id,
    product_id: item.cart_product_variant.product_variant_product_id,
    product_name:
      item.cart_product_variant.product_variant_product.product_name,
    product_price:
      item.cart_product_variant.product_variant_product.product_price,
    product_quantity: item.cart_quantity,
    product_size: item.cart_size,
    product_variant_id: item.cart_product_variant.product_variant_id,
    product_variant_color: item.cart_product_variant.product_variant_color,
    product_variant_image:
      item.cart_product_variant.variant_sample_images.length > 0
        ? item.cart_product_variant.variant_sample_images[0]
            .variant_sample_image_image_url
        : null,
  }));

  return { products: productCart, count: productCart.length };
};

export const cartPostModel = async (
  params: typeCartSchema,
  user: {
    id: string;
  }
) => {
  const cart = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart_table.upsert({
      where: {
        cart_user_id_cart_product_variant_id_cart_size: {
          cart_user_id: user.id,
          cart_product_variant_id: params.product_variant_id,
          cart_size: params.product_size,
        },
      },
      update: {
        cart_quantity: params.product_quantity,
        cart_size: params.product_size,
      },
      create: {
        cart_id: params.cart_id,
        cart_user_id: user.id,
        cart_product_variant_id: params.product_variant_id,
        cart_quantity: params.product_quantity,
        cart_size: params.product_size,
      },
    });

    return cart;
  });

  return { cart, message: "Cart updated" };
};

export const cartDeleteModel = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    await tx.cart_table.delete({
      where: {
        cart_id: id,
      },
    });
  });

  return { message: "Cart deleted" };
};

export const cartPutModel = async (id: string, product_quantity: number) => {
  await prisma.$transaction(async (tx) => {
    await tx.cart_table.update({
      where: {
        cart_id: id,
      },
      data: {
        cart_quantity: product_quantity,
      },
    });
  });

  return { message: "Cart updated" };
};

export const cartGetQuantityModel = async (params: CartGetQuantityParams) => {
  const cart = await prisma.variant_size_table.findMany({
    where: {
      variant_size_variant_id: {
        in: params.items.map((item) => item.product_variant_id),
      },
      variant_size_value: {
        in: params.items.map((item) => item.product_variant_size),
      },
    },
    select: {
      variant_size_variant_id: true,
      variant_size_value: true,
      variant_size_quantity: true,
    },
  });

  return cart;
};

export const cartCheckoutModel = async (
  params: typeCartCheckoutSchema,
  cartItem: typeCartSchema,
  userId: string
) => {
  const cart = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart_table.updateMany({
      where: {
        cart_id: { in: params.items },
      },
      data: {
        cart_to_be_checked_out: true,
      },
    });

    if (!cart) {
      await tx.cart_table.upsert({
        where: {
          cart_user_id_cart_product_variant_id_cart_size: {
            cart_user_id: userId,
            cart_product_variant_id: cartItem.product_variant_id,
            cart_size: cartItem.product_size,
          },
        },
        update: {
          cart_user_id: userId,
          cart_product_variant_id: cartItem.product_variant_id,
          cart_quantity: cartItem.product_quantity,
          cart_size: cartItem.product_size,
          cart_to_be_checked_out: true,
        },
        create: {
          cart_id: cartItem.cart_id,
          cart_user_id: userId,
          cart_product_variant_id: cartItem.product_variant_id,
          cart_quantity: cartItem.product_quantity,
          cart_size: cartItem.product_size,
        },
      });
    }

    return cart;
  });

  return cart;
};
