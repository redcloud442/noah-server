import prisma from "../../../prisma/prisma.js";
export const registerModel = async (params) => {
    const { email, password } = params;
    const user = await prisma.user_table.create({
        data: {
            email,
            password,
        },
    });
    return user;
};
