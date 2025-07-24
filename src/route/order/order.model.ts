import type { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";

export const orderGetModel = async (params: {
  userId: string;
  take: number;
  skip: number;
}) => {
  const { take, skip, userId } = params;

  const offset = (skip - 1) * take;

  const orders = await prisma.order_table.findMany({
    where: {
      order_user_id: userId,
    },
    select: {
      order_id: true,
      order_number: true,
      order_total: true,
      order_status: true,
      order_created_at: true,
      order_address: true,
      order_first_name: true,
      order_last_name: true,
      order_email: true,
      order_phone: true,
      order_postal_code: true,
      order_city: true,
      order_state: true,
    },
    take,
    skip: offset,
  });

  const count = await prisma.order_table.count({
    where: {
      order_user_id: userId,
    },
  });

  return { orders, count };
};

export const orderGetItemsModel = async (params: { orderNumber: string }) => {
  const { orderNumber } = params;

  const orderItems = await prisma.order_table.findMany({
    where: {
      order_number: orderNumber,
    },
    select: {
      order_items: {
        select: {
          order_item_id: true,
          quantity: true,
          price: true,
          size: true,
          product_variant: {
            select: {
              product_variant_id: true,
              product_variant_color: true,
              product_variant_slug: true,
              variant_sample_images: {
                select: {
                  variant_sample_image_image_url: true,
                },
              },
              product_variant_product: {
                select: {
                  product_id: true,
                  product_name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const formattedOrderItems = orderItems.flatMap((order) =>
    order.order_items.map((item) => ({
      order_item_id: item.order_item_id,
      order_item_quantity: item.quantity,
      order_item_price: item.price,
      order_item_color: item.product_variant.product_variant_color,
      product_variant_id: item.product_variant.product_variant_id,
      product_variant_color: item.product_variant.product_variant_color,
      product_variant_size: item.size,
      product_variant_name:
        item.product_variant.product_variant_product.product_name,
      product_variant_image:
        item.product_variant.variant_sample_images.length > 0
          ? item.product_variant.variant_sample_images[0]
              .variant_sample_image_image_url
          : null,
    }))
  );

  return formattedOrderItems;
};

export const orderGetListModel = async (params: {
  teamId: string;
  take: number;
  search: string;
  dateFilter: {
    start: string;
    end: string;
  };
  skip: number;
  userId: string;
}) => {
  const where: Prisma.order_tableWhereInput = {};
  const { take, skip, teamId, userId } = params;

  const offset = (skip - 1) * take;

  const { search, dateFilter } = params;

  const startDate = dateFilter?.start ? new Date(dateFilter.start) : undefined;

  const formattedStartDate = startDate ? startDate : "";

  const endDate = dateFilter?.end ? new Date(dateFilter.end) : undefined;

  const formattedEndDate = endDate ? endDate : "";

  if (search) {
    where.order_number = {
      contains: search,
    };
  }

  if (userId) {
    where.order_user_id = userId;
  }

  if (formattedStartDate) {
    where.order_created_at = {
      gte: formattedStartDate,
      lte: formattedEndDate,
    };
  }

  const orders = await prisma.order_table.findMany({
    where: {
      order_team_id: teamId,
      ...where,
    },
    select: {
      order_id: true,
      order_number: true,
      order_total: true,
      order_status: true,
      order_created_at: true,
      order_phone: true,
      order_payment_method: true,
      order_email: true,
      order_team: {
        select: {
          team_name: true,
        },
      },
    },
    orderBy: {
      order_created_at: "desc",
    },
    take,
    skip: offset,
  });

  const count = await prisma.order_table.count({
    where: {
      order_team_id: teamId,
      ...where,
    },
  });

  const formattedOrders = orders.map((order) => ({
    order_id: order.order_id,
    order_number: order.order_number,
    order_total: order.order_total,
    order_status: order.order_status,
    order_created_at: order.order_created_at,
    order_phone: order.order_phone,
    order_team: order.order_team.team_name,
    order_email: order.order_email,
    order_payment_method: order.order_payment_method,
  }));

  return { orders: formattedOrders, count };
};

export const orderPutModel = async (params: {
  orderId: string;
  status: string;
}) => {
  const where: Prisma.order_tableWhereInput = {};
  const { orderId, status } = params;

  const order = await prisma.order_table.update({
    where: {
      order_id: orderId,
    },
    data: {
      order_status: status as OrderStatus,
    },
  });

  return order;
};
