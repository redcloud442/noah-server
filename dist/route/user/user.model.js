import { Resend } from "resend";
import prisma from "../../utils/prisma.js";
import { redis } from "../../utils/redis.js";
import { supabaseClient } from "../../utils/supabase.js";
const resend = new Resend(process.env.RESEND_API_KEY);
export const getUserModel = async (params) => {
    if (params.role !== "RESELLER") {
        const userData = await prisma.user_table.findUnique({
            where: {
                user_id: params.userId,
            },
            select: {
                user_id: true,
                user_email: true,
                user_first_name: true,
                user_last_name: true,
            },
        });
        const teamMemberProfile = await prisma.team_member_table.findFirst({
            where: {
                team_member_user_id: params.userId,
                team_member_active_team_id: params.activeTeamId,
            },
            select: {
                team_member_id: true,
                team_member_role: true,
                team_member_team_id: true,
                team_member_date_created: true,
                team_member_request_reseller: true,
                team_member_team: {
                    select: {
                        team_id: true,
                        team_name: true,
                        team_date_created: true,
                    },
                },
                team_member_team_group: {
                    select: {
                        team_group_member_id: true,
                        team_group_member_date_created: true,
                        team_group_member_team_member: {
                            select: {
                                team_member_id: true,
                                team_member_role: true,
                                team_member_team_id: true,
                            },
                        },
                    },
                },
            },
        });
        const formattedTeamMemberProfile = {
            team_member_id: teamMemberProfile?.team_member_id,
            team_member_role: teamMemberProfile?.team_member_role,
            team_member_team_id: teamMemberProfile?.team_member_team_id,
            team_member_team: teamMemberProfile?.team_member_team.team_name,
            team_member_request_reseller: teamMemberProfile?.team_member_request_reseller,
            team_member_team_group: teamMemberProfile?.team_member_team_group.map((teamGroup) => ({
                team_group_member_id: teamGroup.team_group_member_id,
                team_group_member_date_created: teamGroup.team_group_member_date_created,
                team_group_member_team_member: teamGroup.team_group_member_team_member,
            })),
            team_member_date_created: teamMemberProfile?.team_member_date_created,
            team_member_active_team_id: params.activeTeamId,
        };
        const data = {
            userProfile: userData,
            teamMemberProfile: formattedTeamMemberProfile,
        };
        return data;
    }
    else {
        const userData = await prisma.user_table.findUnique({
            where: {
                user_id: params.userId,
            },
            select: {
                user_id: true,
                user_email: true,
                user_first_name: true,
                user_last_name: true,
            },
        });
        const teamMemberProfile = await prisma.team_member_table.findFirst({
            where: {
                team_member_user_id: params.userId,
                team_member_active_team_id: params.activeTeamId,
            },
            select: {
                team_member_id: true,
                team_member_role: true,
                team_member_team_id: true,
                team_member_date_created: true,
                team_member_request_reseller: true,
                team_member_team: {
                    select: {
                        team_id: true,
                        team_name: true,
                        team_date_created: true,
                    },
                },
                team_member_team_group: {
                    select: {
                        team_group_member_id: true,
                        team_group_member_date_created: true,
                        team_group_member_team_member: {
                            select: {
                                team_member_id: true,
                                team_member_role: true,
                                team_member_team_id: true,
                            },
                        },
                    },
                },
            },
        });
        const formattedTeamMemberProfile = {
            team_member_id: teamMemberProfile?.team_member_id,
            team_member_role: teamMemberProfile?.team_member_role,
            team_member_team_id: teamMemberProfile?.team_member_team_id,
            team_member_team: teamMemberProfile?.team_member_team.team_name,
            team_member_request_reseller: teamMemberProfile?.team_member_request_reseller,
            team_member_team_group: teamMemberProfile?.team_member_team_group.map((teamGroup) => ({
                team_group_member_id: teamGroup.team_group_member_id,
                team_group_member_date_created: teamGroup.team_group_member_date_created,
                team_group_member_team_member: teamGroup.team_group_member_team_member,
            })),
            team_member_date_created: teamMemberProfile?.team_member_date_created,
            team_member_active_team_id: params.activeTeamId,
        };
        const resellerData = await prisma.reseller_table.findFirst({
            where: {
                reseller_team_member_id: formattedTeamMemberProfile.team_member_id,
            },
        });
        const data = {
            userProfile: userData,
            teamMemberProfile: formattedTeamMemberProfile,
            resellerProfile: resellerData,
        };
        return data;
    }
};
export const getUserListModel = async (params) => {
    const { search, dateFilter, columnAccessor, sortDirection, take, skip, teamId, } = params;
    const filter = {};
    const orderBy = {};
    const offset = (skip - 1) * take;
    if (search) {
        filter.OR = [
            { user_email: { contains: search, mode: "insensitive" } },
            { user_first_name: { contains: search, mode: "insensitive" } },
            { user_last_name: { contains: search, mode: "insensitive" } },
        ];
    }
    if (dateFilter.start && dateFilter.end) {
        filter.user_created_at = {
            gte: new Date(dateFilter.start),
            lte: new Date(dateFilter.end),
        };
    }
    if (columnAccessor) {
        orderBy[columnAccessor] = sortDirection;
    }
    const users = await prisma.user_table.findMany({
        where: {
            ...filter,
            team_member_table: {
                some: {
                    team_member_team_id: teamId,
                    team_member_role: {
                        not: "RESELLER",
                    },
                },
            },
        },
        select: {
            user_id: true,
            user_email: true,
            user_first_name: true,
            user_last_name: true,
            user_created_at: true,
            _count: {
                select: {
                    order_table: {
                        where: {
                            order_status: "PAID", // Only count PAID orders
                        },
                    },
                },
            },
            team_member_table: {
                select: {
                    team_member_id: true,
                    team_member_team_id: true,
                    team_member_role: true,
                },
            },
        },
        orderBy: orderBy,
        take,
        skip: offset,
    });
    const formattedUsers = users.map((user) => ({
        user_id: user.user_id,
        user_email: user.user_email,
        user_first_name: user.user_first_name,
        user_last_name: user.user_last_name,
        user_created_at: user.user_created_at,
        team_member_id: user.team_member_table[0]?.team_member_id,
        team_member_team: user.team_member_table[0]?.team_member_team_id,
        team_member_role: user.team_member_table[0]?.team_member_role,
        order_count: user._count.order_table,
        // order_purchased_amount: user.order_table[0]._sum.order_total,
    }));
    const count = await prisma.user_table.count({
        where: {
            ...filter,
            team_member_table: {
                some: {
                    team_member_team_id: teamId,
                    team_member_role: {
                        not: "RESELLER",
                    },
                },
            },
        },
    });
    return {
        data: formattedUsers,
        count: count,
    };
};
export const getUserListResellerModel = async (params) => {
    const { search, dateFilter, columnAccessor, sortDirection, take, skip, teamId, } = params;
    const filter = {};
    const orderBy = {};
    const offset = (skip - 1) * take;
    if (search) {
        filter.OR = [
            { user_email: { contains: search, mode: "insensitive" } },
            { user_first_name: { contains: search, mode: "insensitive" } },
            { user_last_name: { contains: search, mode: "insensitive" } },
        ];
    }
    if (dateFilter.start && dateFilter.end) {
        filter.user_created_at = {
            gte: new Date(dateFilter.start),
            lte: new Date(dateFilter.end),
        };
    }
    if (columnAccessor) {
        orderBy[columnAccessor] = sortDirection;
    }
    const users = await prisma.user_table.findMany({
        where: {
            ...filter,
            team_member_table: {
                some: {
                    team_member_team_id: teamId,
                    team_member_role: {
                        equals: "RESELLER",
                    },
                },
            },
        },
        select: {
            user_id: true,
            user_email: true,
            user_first_name: true,
            user_last_name: true,
            user_created_at: true,
            team_member_table: {
                select: {
                    team_member_id: true,
                    team_member_role: true,
                },
                take: 1,
            },
        },
        orderBy: orderBy,
        take,
        skip: offset,
    });
    const formattedUsers = users.map((user) => ({
        user_id: user.user_id,
        user_email: user.user_email,
        user_first_name: user.user_first_name,
        user_last_name: user.user_last_name,
        user_created_at: user.user_created_at,
        team_member_id: user.team_member_table[0]?.team_member_id,
        team_member_role: user.team_member_table[0]?.team_member_role,
    }));
    const count = await prisma.user_table.count({
        where: filter,
    });
    return {
        data: formattedUsers,
        count: count,
    };
};
export const createResellerRequestModel = async (params) => {
    const generateResellerCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };
    const resellerCode = generateResellerCode();
    await redis.set(`reseller-request:${params.userId}`, resellerCode, {
        ex: 500,
    });
    const email = await resend.emails.send({
        from: "Reseller Request Code <support@help.noir-clothing.com>",
        to: params.userEmail,
        subject: "Your Reseller Request Code",
        text: `Your reseller request code is: ${resellerCode}`, // plain text fallback
        html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #4B5563;">Welcome to Noir Team!</h2>
        <p>Thank you for your interest in becoming a reseller.</p>
        <p><strong>Your reseller request code is:</strong></p>
        <div style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; border-radius: 6px; display: inline-block; margin: 10px 0;">
          ${resellerCode}
        </div>
        <p>Please keep this code safe and use it to complete your reseller request process.</p>
        <br />
        <p>Best regards,</p>
        <p><strong>Noir Clothing Team</strong></p>
      </div>
    `,
    });
    if (email.error) {
        throw new Error(email.error.message);
    }
    return {
        resellerCode,
    };
};
export const verifyResellerCodeModel = async (params) => {
    const resellerRequest = await redis.get(`reseller-request:${params.userId}`);
    if (!resellerRequest) {
        throw new Error("Invalid or expired code.");
    }
    if (resellerRequest.toString() !== params.otp) {
        throw new Error("Invalid or expired code.");
    }
    await redis.del(`reseller-request:${params.otp}:${params.userId}`);
    await prisma.team_member_table.update({
        where: {
            team_member_id: params.memberId,
        },
        data: {
            team_member_role: "RESELLER",
        },
    });
    let resellerCode;
    let exists = true;
    resellerCode = generateResellerCode();
    while (exists) {
        const existing = await prisma.reseller_table.findUnique({
            where: { reseller_code: resellerCode },
        });
        if (!existing)
            exists = false;
    }
    const data = await prisma.reseller_table.create({
        data: {
            reseller_team_member_id: params.memberId,
            reseller_code: resellerCode,
        },
    });
    await supabaseClient.auth.admin.updateUserById(params.userId, {
        user_metadata: {
            role: "RESELLER",
            resellerId: data.reseller_id,
        },
    });
    const { data: generateLinkData, error: generateLinkError } = await supabaseClient.auth.admin.generateLink({
        type: "magiclink",
        email: params.userEmail,
    });
    if (generateLinkError) {
        throw new Error(generateLinkError.message);
    }
    const email = await resend.emails.send({
        from: "Reseller Promotion <support@help.noir-clothing.com>",
        to: params.userEmail,
        subject: "🎉 Congratulations! You're Now a NOAH Reseller",
        text: `Congratulations on becoming a reseller!`, // ✅ comma was missing here
        html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #10B981; font-size: 24px;">🎉 Congratulations!</h2>
        <p style="font-size: 16px;">We're thrilled to welcome you as a <strong>NOAH Reseller</strong>.</p>
        <p style="font-size: 16px;">
          You're now part of an amazing community earning rewards, exclusive commissions,
          and early access to limited offers.
        </p>
        <br />

        <p style="font-weight: bold;">– The Noir Clothing Team</p>
      </div>
    `,
    });
    if (email.error) {
        throw new Error(email.error.message);
    }
    return {
        message: "OTP verified successfully",
        link: generateLinkData.properties.action_link,
    };
};
export const generateResellerCode = () => {
    const prefix = "RSL";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomCode = "";
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomCode += characters[randomIndex];
    }
    return `${prefix}-${randomCode}`;
};
export const userPatchModel = async (params) => {
    if (params.type === "ban") {
        const { error } = await supabaseClient.auth.admin.updateUserById(params.id, {
            user_metadata: {
                role: "BANNED",
            },
        });
        if (error) {
            throw new Error(error.message);
        }
    }
    else if (params.type === "promote") {
        await prisma.$transaction(async (tx) => {
            const user = await tx.user_table.findUnique({
                where: {
                    user_id: params.id,
                },
                select: {
                    team_member_table: {
                        select: {
                            team_member_id: true,
                        },
                    },
                },
            });
            if (!user) {
                throw new Error("User not found");
            }
            if (params.role !== "RESELLER") {
                await tx.team_member_table.update({
                    where: {
                        team_member_id: user.team_member_table[0]?.team_member_id,
                    },
                    data: {
                        team_member_role: params.role,
                    },
                });
                const { error } = await supabaseClient.auth.admin.updateUserById(params.id, {
                    user_metadata: {
                        role: params.role,
                    },
                });
                if (error) {
                    throw new Error(error.message);
                }
            }
            else {
                await tx.team_member_table.update({
                    where: {
                        team_member_id: user.team_member_table[0]?.team_member_id,
                    },
                    data: {
                        team_member_request_reseller: true,
                        team_member_role: "RESELLER",
                    },
                });
            }
        });
    }
};
export const userChangePasswordModel = async (params) => {
    const { error } = await supabaseClient.auth.admin.updateUserById(params.userId, {
        password: params.password,
    });
    if (error) {
        throw new Error(error.message);
    }
    return { message: "Password updated successfully" };
};
export const userGenerateLoginLinkModel = async (params) => {
    const { data, error } = await supabaseClient.auth.admin.generateLink({
        email: params.email,
        type: "magiclink",
    });
    if (error) {
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error("Failed to generate login link");
    }
    const link = process.env.NODE_ENV === "development"
        ? `http://localhost:3001/auth/callback?hashedToken=${data.properties.hashed_token}`
        : `https://www.noir-clothing.com/auth/callback?hashedToken=${data.properties.hashed_token}`;
    return {
        message: "Login link generated successfully",
        link: link,
    };
};
