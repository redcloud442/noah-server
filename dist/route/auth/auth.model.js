import { sign, verify } from "hono/jwt";
import { envConfig } from "../../env.js";
import prisma from "../../utils/prisma.js";
import { supabaseClient } from "../../utils/supabase.js";
const JWT_SECRET = envConfig.JWT_SECRET;
export const authLoginModel = async (params) => {
    const { email, cart } = params;
    let redirectTo = "/account/orders";
    let userData = await prisma.user_table.findUnique({
        where: {
            user_email: email,
        },
        select: {
            user_id: true,
            user_email: true,
            user_first_name: true,
            user_last_name: true,
            team_member_table: {
                select: {
                    team_member_id: true,
                    team_member_role: true,
                    team_member_team_id: true,
                    team_member_team: {
                        select: {
                            team_id: true,
                            team_name: true,
                        },
                    },
                },
            },
        },
    });
    if (!userData) {
        throw new Error("User not found");
    }
    if (!userData.team_member_table[0].team_member_role.includes("ADMIN") &&
        !userData.team_member_table[0].team_member_role.includes("MEMBER")) {
        throw new Error("User not found");
    }
    if (userData.team_member_table[0].team_member_role === "ADMIN") {
        redirectTo = `/${userData.team_member_table[0].team_member_team.team_name.toLowerCase()}/admin`;
    }
    else {
        redirectTo = "/account/orders";
    }
    if (!userData) {
        throw new Error("User not found");
    }
    if (cart && cart.length > 0) {
        for (const item of cart) {
            await prisma.cart_table.upsert({
                where: {
                    cart_user_id_cart_product_variant_id: {
                        cart_user_id: userData.user_id,
                        cart_product_variant_id: item.product_variant_id,
                    },
                },
                update: {
                    cart_quantity: {
                        increment: item.product_quantity,
                    },
                },
                create: {
                    cart_quantity: item.product_quantity,
                    cart_user_id: userData.user_id,
                    cart_product_variant_id: item.product_variant_id,
                },
            });
        }
    }
    return {
        message: "Login successful",
        redirectTo: redirectTo,
    };
};
export const authLoginResellerModel = async (params) => {
    const { email } = params;
    const user = await prisma.user_table.findUnique({
        where: {
            user_email: email,
        },
        select: {
            user_id: true,
            user_email: true,
            user_first_name: true,
            user_last_name: true,
            team_member_table: {
                select: {
                    team_member_id: true,
                    team_member_role: true,
                    team_member_team_id: true,
                },
            },
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    if (!user.team_member_table[0].team_member_role.includes("RESELLER")) {
        throw new Error("User not found");
    }
    return {
        message: "Login successful",
        redirectTo: "/dashboard",
    };
};
export const authCallbackModel = async (params) => {
    const { email, firstName, lastName, userId, cart } = params;
    let redirectTo = "http://localhost:3001/account";
    const supabase = supabaseClient;
    const isUserExists = await prisma.user_table.findUnique({
        where: {
            user_id: userId,
        },
        select: {
            team_member_table: {
                select: {
                    team_member_id: true,
                },
            },
        },
    });
    let userData = await prisma.user_table.upsert({
        where: {
            user_email: email,
        },
        update: {},
        create: {
            user_id: userId,
            user_email: email,
            user_first_name: firstName,
            user_last_name: lastName,
            team_member_table: {
                connectOrCreate: {
                    where: { team_member_id: "16dcbf9a-1904-43f7-a98a-060f6903661d" },
                    create: {
                        team_member_role: "MEMBER",
                        team_member_team_id: "16dcbf9a-1904-43f7-a98a-060f6903661d",
                        team_member_active_team_id: "16dcbf9a-1904-43f7-a98a-060f6903661d",
                    },
                },
            },
        },
        select: {
            user_id: true,
            user_email: true,
            user_first_name: true,
            user_last_name: true,
            team_member_table: {
                select: {
                    team_member_id: true,
                    team_member_role: true,
                    team_member_team_id: true,
                    team_member_team: {
                        select: {
                            team_id: true,
                            team_name: true,
                        },
                    },
                },
            },
        },
    });
    if (!userData) {
        throw new Error("User not found");
    }
    if (!isUserExists) {
        await supabaseClient.auth.admin.updateUserById(userId, {
            user_metadata: {
                role: "MEMBER",
                firstName: firstName,
                lastName: lastName,
                email: email,
                teamMemberId: userData?.team_member_table[0].team_member_id,
                activeTeamId: "16dcbf9a-1904-43f7-a98a-060f6903661d",
            },
        });
    }
    if (!userData.team_member_table[0].team_member_role.includes("ADMIN") &&
        !userData.team_member_table[0].team_member_role.includes("MEMBER") &&
        !userData.team_member_table[0].team_member_role.includes("RESELLER")) {
        throw new Error("User not found");
    }
    if (userData.team_member_table[0].team_member_role === "ADMIN") {
        redirectTo = `/${userData.team_member_table[0].team_member_team.team_name.toLowerCase()}/admin`;
    }
    else {
        redirectTo = `http://localhost:3001/account`;
    }
    if (!userData) {
        throw new Error("User not found");
    }
    if (cart && cart.length > 0) {
        for (const item of cart) {
            await prisma.cart_table.upsert({
                where: {
                    cart_user_id_cart_product_variant_id: {
                        cart_user_id: userData.user_id,
                        cart_product_variant_id: item.product_variant_id,
                    },
                },
                update: {
                    cart_quantity: {
                        increment: item.product_quantity,
                    },
                },
                create: {
                    cart_id: item.cart_id,
                    cart_quantity: item.product_quantity,
                    cart_user_id: userData.user_id,
                    cart_product_variant_id: item.product_variant_id,
                },
            });
        }
    }
    return {
        message: "Login successful",
        redirectTo: redirectTo,
    };
};
export const authRegisterModel = async (params) => {
    const { userId, email, firstName, lastName, cart } = params;
    const user = await prisma.$transaction(async (tx) => {
        const userData = await tx.user_table.create({
            data: {
                user_id: userId,
                user_email: email,
                user_first_name: firstName,
                user_last_name: lastName,
                team_member_table: {
                    create: {
                        team_member_role: "MEMBER",
                        team_member_team_id: "16dcbf9a-1904-43f7-a98a-060f6903661d",
                        team_member_active_team_id: "16dcbf9a-1904-43f7-a98a-060f6903661d",
                    },
                },
            },
            select: {
                user_id: true,
                user_email: true,
                user_first_name: true,
                user_last_name: true,
                team_member_table: {
                    select: {
                        team_member_id: true,
                        team_member_role: true,
                        team_member_team_id: true,
                    },
                },
            },
        });
        return userData;
    });
    if (cart && cart.length > 0) {
        for (const item of cart) {
            await prisma.cart_table.upsert({
                where: {
                    cart_user_id_cart_product_variant_id: {
                        cart_user_id: user.user_id,
                        cart_product_variant_id: item.product_variant_id,
                    },
                },
                update: {
                    cart_quantity: {
                        increment: item.product_quantity,
                    },
                },
                create: {
                    cart_id: item.cart_id,
                    cart_quantity: item.product_quantity,
                    cart_user_id: user.user_id,
                    cart_product_variant_id: item.product_variant_id,
                },
            });
        }
    }
    await supabaseClient.auth.admin.updateUserById(userId, {
        user_metadata: {
            role: "MEMBER",
            firstName: firstName,
            lastName: lastName,
            email: email,
            teamMemberId: user.team_member_table[0].team_member_id,
            activeTeamId: "16dcbf9a-1904-43f7-a98a-060f6903661d",
        },
    });
    return {
        message: "Register successful",
        redirectTo: "/account/orders",
    };
};
export const createCheckoutTokenModel = async (params) => {
    const { checkoutNumber, referralCode, user } = params;
    const customPayload = {
        checkoutNumber: checkoutNumber,
        role: user ? user.user_metadata.role : "ANONYMOUS",
        referralCode: referralCode,
    };
    const newToken = await sign(customPayload, JWT_SECRET);
    return newToken;
};
export const verifyCheckoutTokenModel = async (params) => {
    const { token } = params;
    const decoded = await verify(token, JWT_SECRET);
    if (decoded.role !== "ANONYMOUS") {
        throw new Error("Invalid token");
    }
    return {
        message: "Checkout verified",
        success: true,
    };
};
export const authSaveCartModel = async (params) => {
    const { cart, userId } = params;
    if (cart && cart.length > 0) {
        for (const item of cart) {
            await prisma.cart_table.upsert({
                where: {
                    cart_user_id_cart_product_variant_id: {
                        cart_user_id: userId,
                        cart_product_variant_id: item.product_variant_id,
                    },
                },
                update: {
                    cart_quantity: {
                        increment: item.product_quantity,
                    },
                },
                create: {
                    cart_id: item.cart_id,
                    cart_quantity: item.product_quantity,
                    cart_user_id: userId,
                    cart_product_variant_id: item.product_variant_id,
                },
            });
        }
    }
    return {
        message: "Cart saved",
    };
};
