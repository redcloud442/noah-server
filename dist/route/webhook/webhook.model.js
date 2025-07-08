import prisma from "../../utils/prisma.js";
export const WebhookPaymentModel = async (params) => {
    const { eventType, event } = params;
    const paymentIntent = event.attributes.data.attributes.payment_intent_id;
    switch (eventType) {
        case "payment.paid":
            await prisma.$transaction(async (tx) => {
                const order = await tx.order_table.findUnique({
                    where: { order_payment_id: paymentIntent, order_status: "UNPAID" },
                    include: { order_items: true, order_reseller: true },
                });
                if (!order)
                    throw new Error("Order not found");
                const variantIds = order.order_items.map((i) => i.product_variant_id);
                const sizes = order.order_items.map((i) => i.size ?? "");
                const quantities = order.order_items.reduce((sum, i) => sum + i.quantity, 0);
                await tx.order_table.update({
                    where: { order_payment_id: paymentIntent },
                    data: { order_status: "PAID" },
                });
                if (order.order_reseller_id) {
                    if (order.order_reseller) {
                        const referralAmount = (order.order_total ?? 0) * 0.1;
                        await tx.reseller_transaction_table.create({
                            data: {
                                reseller_transaction_reseller_id: order.order_reseller_id,
                                reseller_transaction_amount: referralAmount,
                                reseller_transaction_type: "REFERRAL",
                                reseller_transaction_status: "NON-WITHDRAWABLE",
                            },
                        });
                        await tx.reseller_table.update({
                            where: { reseller_id: order.order_reseller_id },
                            data: {
                                reseller_non_withdrawable_earnings: {
                                    increment: referralAmount,
                                },
                            },
                        });
                    }
                }
                await tx.variant_size_table.updateMany({
                    where: {
                        variant_size_variant_id: { in: variantIds },
                        variant_size_value: { in: sizes },
                    },
                    data: {
                        variant_size_quantity: {
                            decrement: quantities,
                        },
                    },
                });
                if (order.order_user_id) {
                    await tx.cart_table.deleteMany({
                        where: {
                            cart_product_variant_id: { in: variantIds },
                            cart_size: { in: sizes },
                            cart_user_id: order.order_user_id,
                            cart_to_be_checked_out: true,
                        },
                    });
                }
            });
            break;
        case "payment.failed":
            await prisma.$transaction(async (tx) => {
                await tx.order_table.update({
                    where: { order_payment_id: paymentIntent },
                    data: { order_status: "CANCELED" },
                });
            });
            break;
        default:
            console.log("📦 Unhandled event type:", eventType);
    }
};
