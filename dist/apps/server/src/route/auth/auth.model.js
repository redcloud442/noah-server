import { sign } from "hono/jwt";
import { envConfig } from "../../env.js";
import prisma from "../../utils/prisma.js";
const JWT_SECRET = envConfig.JWT_SECRET;
export const authLoginModel = async (params) => {
    const { email, firstName, lastName, userId } = params;
    let userData = await prisma.user_table.findUnique({
        where: {
            user_email: email,
        },
    });
    if (!userData && firstName && lastName && userId) {
        userData = await prisma.user_table.create({
            data: {
                user_id: userId,
                user_email: email,
                user_first_name: firstName,
                user_last_name: lastName,
                user_group: {
                    connect: {
                        user_group_id: "79b0d3b5-f110-4874-a9b8-72777fd4257a",
                    },
                },
            },
            select: {
                user_id: true,
                user_email: true,
                user_first_name: true,
                user_last_name: true,
                user_group: {
                    select: {
                        user_group_id: true,
                        user_group_name: true,
                    },
                },
                user_created_at: true,
                user_updated_at: true,
                user_profile_picture: true,
                user_group_id: true,
            },
        });
    }
    console.log(userData);
    if (!userData) {
        throw new Error("User not found");
    }
    const userGroup = await prisma.user_group_table.findUnique({
        where: {
            user_group_id: userData.user_group_id,
        },
    });
    const customPayload = {
        id: userData.user_id,
        email: userData.user_email,
        role: userGroup?.user_group_name,
    };
    const newToken = await sign(customPayload, JWT_SECRET);
    return {
        message: "Login successful",
        token: newToken,
    };
};
export const authRegisterModel = async (params) => {
    const { userId, email, firstName, lastName } = params;
    const user = await prisma.$transaction(async (tx) => {
        const userData = await tx.user_table.create({
            data: {
                user_id: userId,
                user_email: email,
                user_first_name: firstName,
                user_last_name: lastName,
                user_group: {
                    connect: {
                        user_group_id: "79b0d3b5-f110-4874-a9b8-72777fd4257a",
                    },
                },
            },
            select: {
                user_id: true,
                user_email: true,
                user_first_name: true,
                user_last_name: true,
                user_group: {
                    select: {
                        user_group_id: true,
                        user_group_name: true,
                    },
                },
            },
        });
        return userData;
    });
    const customPayload = {
        id: user.user_id,
        email: user.user_email,
        role: user.user_group.user_group_name,
    };
    const newToken = await sign(customPayload, JWT_SECRET);
    return {
        message: "Register successful",
        token: newToken,
    };
};
