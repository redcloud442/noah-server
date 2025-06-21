import prisma from "../../utils/prisma.js";
export const addressGetModel = async (params) => {
    const { take, skip, user } = params;
    const offset = (skip - 1) * take;
    const address = await prisma.user_address_table.findMany({
        where: {
            user_address_user_id: user.id,
        },
        select: {
            user_address_user: true,
            user_address_email: true,
            user_address_address: true,
            user_address_city: true,
            user_address_state: true,
            user_address_postal_code: true,
            user_address_phone: true,
            user_address_first_name: true,
            user_address_last_name: true,
            user_address_barangay: true,
            user_address_id: true,
            user_address_is_default: true,
        },
        take,
        skip: offset,
        orderBy: {
            user_address_is_default: "desc",
        },
    });
    const count = await prisma.user_address_table.count({
        where: {
            user_address_user_id: user.id,
        },
    });
    return { address, count };
};
export const addressCreateModel = async (params) => {
    const { user, addressData } = params;
    await prisma.user_address_table.create({
        data: {
            user_address_email: addressData.email,
            user_address_user_id: user.id,
            user_address_address: addressData.address,
            user_address_city: addressData.city,
            user_address_state: addressData.province,
            user_address_postal_code: addressData.postalCode,
            user_address_phone: addressData.phone,
            user_address_first_name: addressData.firstName,
            user_address_last_name: addressData.lastName,
            user_address_barangay: addressData.barangay,
            user_address_is_default: addressData.is_default,
        },
    });
};
export const addressUpdateModel = async (params) => {
    const { addressData, id } = params;
    await prisma.$transaction(async (tx) => {
        await tx.user_address_table.update({
            where: {
                user_address_id: id,
            },
            data: {
                user_address_email: addressData.email,
                user_address_address: addressData.address,
                user_address_city: addressData.city,
                user_address_state: addressData.province,
                user_address_postal_code: addressData.postalCode,
                user_address_phone: addressData.phone,
                user_address_first_name: addressData.firstName,
                user_address_last_name: addressData.lastName,
                user_address_barangay: addressData.barangay,
                user_address_is_default: addressData.is_default,
            },
        });
    });
};
export const addressSetDefaultModel = async (params) => {
    const { id, userId } = params;
    await prisma.$transaction(async (tx) => {
        await tx.user_address_table.updateMany({
            where: {
                user_address_user_id: userId,
            },
            data: {
                user_address_is_default: false,
            },
        });
        await tx.user_address_table.update({
            where: {
                user_address_id: id,
            },
            data: {
                user_address_is_default: true,
            },
        });
    });
};
export const addressDeleteModel = async (params) => {
    const { id } = params;
    await prisma.$transaction(async (tx) => {
        await tx.user_address_table.delete({
            where: {
                user_address_id: id,
            },
        });
    });
};
