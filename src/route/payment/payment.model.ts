import type { user_table } from "@prisma/client";
import axios, { AxiosError } from "axios";
import prisma from "../../utils/prisma.js";
import type {
  CheckoutFormData,
  PaymentCreatePaymentFormData,
} from "../../utils/schema.js";

export const createPaymentIntent = async (
  params: CheckoutFormData,
  user: user_table & { id: string }
) => {
  const {
    amount,
    productVariant,
    order_number,
    email,
    firstName,
    lastName,
    phone,
    address,
    city,
    province,
    postalCode,
    shippingOption,
    barangay,
    referralCode,
  } = params;

  const productVariantIds = productVariant.map(
    (item) => item.product_variant_id
  );

  const paymentIntent = await prisma.$transaction(async (tx) => {
    const placeholders = productVariantIds
      .map((_, i) => `$${i + 1}::uuid`)
      .join(", ");

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
      ...productVariantIds
    );

    // Build nested Map<variant_id, Map<size, quantity>>
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
    for (const item of productVariant) {
      const sizeMap = productStockMap.get(item.product_variant_id);
      const sizeKey = item.product_variant_size ?? "";
      const availableStock = sizeMap?.get(sizeKey);

      if (availableStock === undefined) {
        throw new Error(
          `Product variant ${item.product_variant_id} with size ${sizeKey} not found.`
        );
      }

      if (availableStock < item.product_variant_quantity) {
        throw new Error(
          `Insufficient stock for product ${item.product_variant_id} size ${sizeKey}.`
        );
      }
    }
    const dataAmount = Math.round(20 * 100);

    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      {
        data: {
          attributes: {
            amount: dataAmount, // must be an integer in centavos
            payment_method_allowed: [
              "card",
              "dob",
              "paymaya",
              "gcash",
              "grab_pay",
            ],
            payment_method_options: {
              card: {
                request_three_d_secure: "any",
              },
            },
            currency: "PHP",
            capture_type: "automatic",
            description: `Payment for order ${order_number}`,
            statement_descriptor: "Order Payment",
          },
        },
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY! + ":").toString("base64")}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to create payment intent");
    }

    const data = response.data;

    let referral = null;
    if (referralCode) {
      const referralData = await prisma.reseller_table.findUnique({
        where: {
          reseller_code: referralCode ?? "",
        },
      });
      referral = referralData;
    }

    const paymentIntent = await tx.order_table.create({
      data: {
        order_user_id: user.id ? user.id : null,
        order_number: order_number,
        order_status: "PENDING",
        order_total: amount,
        order_payment_id: data.data.id,
        order_email: email,
        order_first_name: firstName,
        order_last_name: lastName,
        order_phone: phone,
        order_address: address,
        order_city: city,
        order_state: province,
        order_postal_code: postalCode,
        order_delivery_option: shippingOption,
        order_barangay: barangay,
        order_team_id: "16dcbf9a-1904-43f7-a98a-060f6903661d",
        order_reseller_id: referral ? referral.reseller_id : null,
      },
      select: {
        order_id: true,
      },
    });

    await tx.order_item_table.createMany({
      data: productVariant.map((variant) => ({
        order_id: paymentIntent.order_id,
        product_variant_id: variant.product_variant_id,
        quantity: variant.product_variant_quantity,
        price: variant.product_variant_price,
        size: variant.product_variant_size,
        color: variant.product_variant_color,
      })),
    });

    return {
      paymentIntent: data.data.id,
      paymentIntentStatus: data.data.attributes.status,
      order_id: paymentIntent.order_id,
      order_number: order_number,
    };
  });

  return {
    paymentIntent: paymentIntent.paymentIntent,
    paymentIntentStatus: "SUCCESS",
    order_id: paymentIntent.order_id,
    order_number: order_number,
    order_status: "PENDING",
    order_total: amount,
  };
};

export const createPaymentMethod = async (
  params: PaymentCreatePaymentFormData
) => {
  try {
    const { order_number, payment_method, payment_type } = params;

    const payment_details =
      payment_method === "card" ? params.payment_details : undefined;

    const orderDetails = await prisma.order_table.findUnique({
      where: { order_number },
    });

    if (!orderDetails) {
      throw new Error("Order not found");
    }

    let expiry_month, expiry_year;
    if (payment_details?.card.card_expiry) {
      [expiry_month, expiry_year] = payment_details.card.card_expiry.split("/");

      if (!expiry_month || !expiry_year) {
        throw new Error("Invalid card expiry format. Expected MM/YY");
      }

      // Convert to full year (e.g., "31" → 2031)
      if (expiry_year.length === 2) {
        expiry_year = `${expiry_year}`;
      }
    }

    const createPaymentMethod = await axios.post(
      "https://api.paymongo.com/v1/payment_methods",
      {
        data: {
          attributes: {
            type:
              payment_method === "card"
                ? "card"
                : payment_method === "online_banking"
                  ? "dob"
                  : payment_type?.toLowerCase() === "grabpay"
                    ? "grab_pay"
                    : payment_type?.toLowerCase(),
            details:
              payment_method === "card"
                ? {
                    card_number: payment_details?.card.card_number,
                    exp_month: parseInt(expiry_month ?? "0"),
                    exp_year: parseInt(expiry_year ?? "0"),
                    cvc: payment_details?.card.card_cvv,
                  }
                : payment_method === "online_banking"
                  ? {
                      bank_code:
                        payment_type?.toLowerCase() === "bpi" ? "bpi" : "ubp",
                    }
                  : undefined,
            billing: {
              address: {
                line1: orderDetails.order_address,
                city: orderDetails.order_city,
                state: orderDetails.order_state,
                postal_code: orderDetails.order_postal_code,
                country: "PH",
              },
              name: `${orderDetails.order_first_name} ${orderDetails.order_last_name}`,
              email: orderDetails.order_email,
              phone: orderDetails.order_phone,
            },
          },
        },
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY! + ":").toString("base64")}`,
        },
      }
    );

    if (createPaymentMethod.status !== 200) {
      throw new Error("Failed to create payment method");
    }

    // Attach Payment Method
    const attachPaymentMethod = await axios.post(
      `https://api.paymongo.com/v1/payment_intents/${orderDetails.order_payment_id}/attach`,
      {
        data: {
          attributes: {
            payment_method: createPaymentMethod.data.data.id,
            client_key: createPaymentMethod.data.data.attributes.client_key,
            return_url: `${process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://www.noir-clothing.com"}/payment/pn/${orderDetails.order_number}/redirect`,
          },
        },
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY! + ":").toString("base64")}`,
        },
      }
    );

    if (attachPaymentMethod.status !== 200) {
      throw new Error("Failed to attach payment method");
    }

    await prisma.order_table.update({
      where: { order_number },
      data: {
        order_payment_method_id: createPaymentMethod.data.data.id,
        order_payment_method:
          payment_method === "card" ? "card" : payment_type?.toLowerCase(),
        order_status: "UNPAID",
      },
    });

    return {
      paymentStatus: attachPaymentMethod.data.data.attributes.status,
      nextAction: attachPaymentMethod.data.data.attributes.next_action,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log(error.response?.data);
    }
    throw new Error("Payment process failed");
  }
};

export const getPayment = async ({
  paymentIntentId,
  clientKey,
  orderNumber,
}: {
  paymentIntentId: string;
  clientKey: string;
  orderNumber: string;
}) => {
  try {
    // 🔄 Retrieve Payment Intent from PayMongo
    const paymentIntent = await axios.get(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}?client_key=${clientKey}`,
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY! + ":").toString("base64")}`,
        },
      }
    );

    if (paymentIntent.status !== 200 || !paymentIntent.data?.data) {
      throw new Error("Failed to retrieve payment intent from PayMongo");
    }

    const paymentStatus = paymentIntent.data.data.attributes.status;

    const statusMap = {
      succeeded: "PAID",
      failed: "CANCELED",
    } as const;

    const orderStatus: "PAID" | "CANCELED" | "PENDING" | "UNPAID" =
      statusMap[paymentStatus as keyof typeof statusMap] ?? "UNPAID";

    return { orderStatus, paymentStatus };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("PayMongo error:", error.response?.data);
    }
    console.error("GetPayment failed:", error);
    throw new Error("Failed to retrieve payment status");
  }
};
