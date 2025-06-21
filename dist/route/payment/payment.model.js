import axios from "axios";
import { Resend } from "resend";
import prisma from "../../utils/prisma.js";
const resend = new Resend(process.env.RESEND_API_KEY);
export const createPaymentIntent = async (params, user) => {
    const { amount, productVariant, order_number, email, firstName, lastName, phone, address, city, province, postalCode, barangay, referralCode, } = params;
    const productVariantIds = productVariant.map((item) => item.product_variant_id);
    const existingProducts = await prisma.product_variant_table.findMany({
        where: {
            product_variant_id: { in: productVariantIds },
        },
        select: {
            product_variant_id: true,
            variant_sizes: {
                select: {
                    variant_size_quantity: true,
                },
            },
        },
    });
    const productStockMap = new Map(existingProducts.map((product) => [
        product.product_variant_id,
        product.variant_sizes.reduce((total, size) => total + size.variant_size_quantity, 0),
    ]));
    for (const item of productVariant) {
        const availableStock = productStockMap.get(item.product_variant_id);
        if (availableStock === undefined) {
            throw new Error(`Product variant ${item.product_variant_id} not found.`);
        }
        if (availableStock < item.product_variant_quantity) {
            throw new Error(`Insufficient stock for product ${item.product_variant_id}.`);
        }
    }
    const dataAmount = Math.round(amount * 100);
    const response = await axios.post("https://api.paymongo.com/v1/payment_intents", {
        data: {
            attributes: {
                amount: dataAmount, // must be an integer in centavos
                payment_method_allowed: ["card", "dob", "paymaya", "gcash"],
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
    }, {
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
        },
    });
    if (response.status !== 200) {
        throw new Error("Failed to create payment intent");
    }
    const data = response.data;
    const paymentIntent = await prisma.$transaction(async (tx) => {
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
        paymentIntent: data.data.id,
        paymentIntentStatus: "SUCCESS",
        order_id: paymentIntent.order_id,
        order_number: order_number,
        order_status: "PENDING",
        order_total: amount,
    };
};
export const createPaymentMethod = async (params) => {
    try {
        const { order_number, payment_method, payment_type } = params;
        const payment_details = payment_method === "card" ? params.payment_details : undefined;
        const orderDetails = await prisma.order_table.findUnique({
            where: { order_number },
        });
        if (!orderDetails) {
            throw new Error("Order not found");
        }
        let expiry_year, expiry_month;
        if (payment_details?.card.card_expiry) {
            [expiry_month, expiry_year] = payment_details.card.card_expiry.split("/");
            if (!expiry_year || !expiry_month) {
                throw new Error("Invalid card expiry format. Expected YYYY-MM");
            }
        }
        const createPaymentMethod = await axios.post("https://api.paymongo.com/v1/payment_methods", {
            data: {
                attributes: {
                    type: payment_method === "card" ? "card" : payment_type?.toLowerCase(),
                    details: payment_method === "card"
                        ? {
                            card: {
                                number: payment_details?.card.card_number,
                                expiry_year,
                                expiry_month,
                                cvv: payment_details?.card.card_cvv,
                            },
                        }
                        : undefined,
                    billing: {
                        name: `${orderDetails.order_first_name} ${orderDetails.order_last_name}`,
                        email: orderDetails.order_email,
                        phone: orderDetails.order_phone,
                    },
                },
            },
        }, {
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
            },
        });
        if (createPaymentMethod.status !== 200) {
            throw new Error("Failed to create payment method");
        }
        // Attach Payment Method
        const attachPaymentMethod = await axios.post(`https://api.paymongo.com/v1/payment_intents/${orderDetails.order_payment_id}/attach`, {
            data: {
                attributes: {
                    payment_method: createPaymentMethod.data.data.id,
                    client_key: createPaymentMethod.data.data.attributes.client_key,
                    return_url: `http://localhost:3001/payment/pn/${orderDetails.order_number}/redirect`,
                },
            },
        }, {
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
            },
        });
        if (attachPaymentMethod.status !== 200) {
            throw new Error("Failed to attach payment method");
        }
        await prisma.order_table.update({
            where: { order_number },
            data: {
                order_payment_method_id: createPaymentMethod.data.data.id,
                order_payment_method: payment_method === "card" ? "card" : payment_type?.toLowerCase(),
                order_status: "PENDING",
            },
        });
        return {
            paymentStatus: attachPaymentMethod.data.data.attributes.status,
            nextAction: attachPaymentMethod.data.data.attributes.next_action,
        };
    }
    catch (error) {
        throw new Error("Payment process failed");
    }
};
export const getPayment = async (params) => {
    try {
        const orderDetails = await prisma.order_table.findUnique({
            where: { order_number: params.orderNumber },
            include: {
                order_items: true,
            },
        });
        if (orderDetails?.order_status !== "PENDING") {
            throw new Error("Payment already processed");
        }
        // 🔄 1️⃣ Retrieve Payment Intent
        const paymentIntent = await axios.get(`https://api.paymongo.com/v1/payment_intents/${params.paymentIntentId}?client_key=${params.clientKey}`, {
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
            },
        });
        if (paymentIntent.status !== 200 || !paymentIntent.data.data) {
            throw new Error("Payment intent not found");
        }
        const paymentStatus = paymentIntent.data.data.attributes.status;
        let orderStatus = "PENDING";
        switch (paymentStatus) {
            case "succeeded":
                orderStatus = "PAID";
                break;
            case "failed":
                orderStatus = "CANCELED";
                break;
            default:
                orderStatus = "PENDING";
        }
        await prisma.$transaction(async (tx) => {
            const status = !!(await tx.order_table.findUnique({
                where: { order_number: params.orderNumber, order_status: "PENDING" },
                select: { order_status: true },
            }));
            if (!status) {
                throw new Error("Payment already processed");
            }
            await tx.order_table.update({
                where: { order_number: params.orderNumber },
                data: { order_status: orderStatus },
            });
            if (orderStatus === "PAID") {
                if (orderDetails?.order_reseller_id) {
                    const referral = await tx.reseller_table.findUnique({
                        where: { reseller_id: orderDetails?.order_reseller_id ?? "" },
                    });
                    if (referral) {
                        const referralAmount = (orderDetails?.order_total ?? 0) * 0.1;
                        await tx.reseller_transaction_table.create({
                            data: {
                                reseller_transaction_reseller_id: referral.reseller_id,
                                reseller_transaction_amount: referralAmount,
                                reseller_transaction_type: "REFERRAL",
                                reseller_transaction_status: "NON-WITHDRAWABLE",
                            },
                        });
                        await tx.reseller_table.update({
                            where: { reseller_id: referral.reseller_id },
                            data: {
                                reseller_non_withdrawable_earnings: {
                                    increment: referralAmount,
                                },
                            },
                        });
                    }
                }
                await tx.cart_table.deleteMany({
                    where: {
                        cart_product_variant_id: {
                            in: orderDetails?.order_items.map((item) => item.product_variant_id),
                        },
                        cart_size: {
                            in: orderDetails?.order_items.map((item) => item.size ?? ""),
                        },
                        cart_user_id: orderDetails?.order_user_id ?? undefined,
                        cart_to_be_checked_out: true,
                    },
                });
                await prisma.variant_size_table.updateMany({
                    where: {
                        variant_size_variant_id: {
                            in: orderDetails?.order_items.map((item) => item.product_variant_id),
                        },
                        variant_size_value: {
                            in: orderDetails?.order_items.map((item) => item.size ?? ""),
                        },
                    },
                    data: {
                        variant_size_quantity: {
                            decrement: orderDetails?.order_items.reduce((total, item) => total + item.quantity, 0),
                        },
                    },
                });
                await resend.emails.send({
                    from: "Payment Success <support@help.noir-clothing.com>",
                    to: orderDetails?.order_email ?? "",
                    subject: "🎉 Congratulations! Your Payment is Successful – Welcome to Noir Clothing!",
                    text: `Congratulations on completing your purchase! Your payment was successful.}`,
                    html: `
              <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2 style="color: #10B981; font-size: 24px;">🎉 Congratulations!</h2>
                <p style="font-size: 16px;">We're excited to welcome you to <strong>Noir Clothing</strong>!</p>
                <p style="font-size: 16px;">
                  Your payment was <strong>successfully processed</strong>. You can now enjoy exclusive access to our latest collections and rewards.
                </p>
                <p style="font-size: 16px;">
                  Track the status of your order anytime with the link below:
                </p>
                <p style="margin: 20px 0;">
                  <a href="${orderDetails?.order_number ? `https://noir-clothing.com/track/${orderDetails.order_number}` : "#"}" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Track Your Order
                  </a>
                </p>
                <br />
                <p style="font-size: 14px; color: #555;">Thank you for trusting Noir Clothing. We’re excited to have you with us!</p>
                <p style="font-weight: bold;">– The Noir Clothing Team</p>
              </div>
            `,
                });
            }
            else {
                await resend.emails.send({
                    from: "Noir Clothing Support <support@help.noir-clothing.com>",
                    to: orderDetails?.order_email ?? "",
                    subject: "Payment Unsuccessful - Please Try Again",
                    text: `Hi there, unfortunately your payment could not be processed. Please try again or contact our support team if the issue persists.`,
                    html: `
              <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2 style="color: #EF4444; font-size: 24px;">Payment Unsuccessful</h2>
                <p style="font-size: 16px; margin-bottom: 16px;">
                  Unfortunately, we were unable to process your payment.
                </p>
                <p style="font-size: 16px; margin-bottom: 16px;">
                  Please try again. If the issue continues, feel free to reach out to our support team for assistance.
                </p>
                <p style="font-size: 16px; margin-bottom: 32px;">
                  We apologize for the inconvenience and appreciate your patience.
                </p>
                <p style="font-weight: bold;">– The Noir Clothing Team</p>
              </div>
            `,
                });
                await prisma.variant_size_table.updateMany({
                    where: {
                        variant_size_variant_id: {
                            in: orderDetails?.order_items.map((item) => item.product_variant_id),
                        },
                        variant_size_value: {
                            in: orderDetails?.order_items.map((item) => item.size ?? ""),
                        },
                    },
                    data: {
                        variant_size_quantity: {
                            increment: orderDetails?.order_items.reduce((total, item) => total + item.quantity, 0),
                        },
                    },
                });
            }
        });
        return { orderStatus, paymentStatus };
    }
    catch (error) {
        throw new Error("Failed to retrieve payment status");
    }
};
