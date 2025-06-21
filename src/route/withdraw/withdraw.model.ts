import { Prisma } from "@prisma/client";
import type {
  typeWithdrawalActionSchema,
  typeWithdrawalListSchema,
  WithdrawalSchema,
} from "../../schema/schema.js";
import prisma from "../../utils/prisma.js";

export const withdrawModel = async (
  params: WithdrawalSchema,
  resellerId: string
) => {
  const { provider, amount, accountNumber, accountName } = params;

  const data = await prisma.$transaction(async (tx) => {
    const amountMatch = await tx.$queryRaw<
      {
        reseller_withdrawable_earnings: number;
        reseller_non_withdrawable_earnings: number;
      }[]
    >`SELECT
     reseller_withdrawable_earnings,
     reseller_non_withdrawable_earnings
     FROM reseller_schema.reseller_table
     WHERE reseller_id = ${resellerId}::uuid
     FOR UPDATE`;

    if (amountMatch[0].reseller_withdrawable_earnings < amount) {
      throw new Error("Insufficient balance");
    }

    await tx.reseller_withdrawal_table.create({
      data: {
        reseller_withdrawal_amount: amount,
        reseller_withdrawal_bank_name: provider,
        reseller_withdrawal_account_number: accountNumber,
        reseller_withdrawal_account_name: accountName,
        reseller_withdrawal_status: "PENDING",
        reseller_withdrawal_reseller_id: resellerId,
      },
    });

    const data = await tx.reseller_transaction_table.create({
      data: {
        reseller_transaction_amount: amount,
        reseller_transaction_reseller_id: resellerId,
        reseller_transaction_type: "WITHDRAWAL",
        reseller_transaction_status: "ONGOING",
      },
    });

    await tx.reseller_table.update({
      where: { reseller_id: resellerId },
      data: {
        reseller_withdrawable_earnings: { decrement: amount },
      },
    });

    return {
      data,
    };
  });

  return data;
};

export const withdrawalListModel = async (params: typeWithdrawalListSchema) => {
  const {
    take,
    skip,
    search,
    sortDirection,
    columnAccessor,
    dateFilter,
    status,
    teamId,
  } = params;

  const filter: Prisma.reseller_withdrawal_tableWhereInput = {};
  const statusFilter: Prisma.reseller_withdrawal_tableWhereInput = {};
  const offset = skip ? (skip - 1) * take : 0;

  if (search) {
    filter.OR = [
      {
        reseller_withdrawal_account_name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        reseller_withdrawal_account_number: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        reseller_withdrawal_bank_name: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // if (teamId) {
  //   filter.reseller_withdrawal_reseller_id = teamId;
  // }

  if (status) {
    statusFilter.reseller_withdrawal_status = status;
  }

  if (dateFilter.start && dateFilter.end) {
    filter.reseller_withdrawal_created_at = {
      gte: dateFilter.start,
      lte: dateFilter.end,
    };
  }

  let orderBy: Prisma.reseller_withdrawal_tableOrderByWithRelationInput = {};

  if (columnAccessor) {
    if (columnAccessor === "user_email") {
      orderBy = {
        reseller_withdrawal_reseller: {
          reseller_team_member: {
            team_member_user: {
              user_email: sortDirection as Prisma.SortOrder,
            },
          },
        },
      };
    } else if (columnAccessor) {
      orderBy = {
        [columnAccessor]: sortDirection as Prisma.SortOrder,
      } as Prisma.reseller_withdrawal_tableOrderByWithRelationInput;
    }
  }

  const data = await prisma.reseller_withdrawal_table.findMany({
    where: {
      AND: [filter, statusFilter],
    },
    select: {
      reseller_withdrawal_id: true,
      reseller_withdrawal_amount: true,
      reseller_withdrawal_account_name: true,
      reseller_withdrawal_account_number: true,
      reseller_withdrawal_bank_name: true,
      reseller_withdrawal_status: true,
      reseller_withdrawal_created_at: true,
      reseller_withdrawal_updated_at: true,
      reseller_withdrawal_reseller_id: true,
      action_by: {
        select: {
          team_member_user: {
            select: {
              user_email: true,
              user_first_name: true,
              user_last_name: true,
            },
          },
        },
      },
      reseller_withdrawal_reseller: {
        select: {
          reseller_team_member: {
            select: {
              team_member_user: {
                select: {
                  user_email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy,
    take,
    skip: offset,
  });

  const formattedData = data.map((item) => ({
    ...item,
    action_by: item.action_by?.team_member_user?.user_email,
    reseller_withdrawal_reseller:
      item.reseller_withdrawal_reseller?.reseller_team_member?.team_member_user
        ?.user_email,
  }));

  const count = await prisma.reseller_withdrawal_table.groupBy({
    where: filter,
    by: ["reseller_withdrawal_status"],
    _count: true,
  });

  const total = count.reduce((acc: Record<string, number>, curr) => {
    acc[curr.reseller_withdrawal_status] = curr._count;
    return acc;
  }, {});

  return {
    data: formattedData,
    total,
  };
};

export const withdrawalActionModel = async (
  params: typeWithdrawalActionSchema,
  actionBy: string
) => {
  const { withdrawalId, resellerId, status } = params;

  const memberId = await prisma.team_member_table.findFirst({
    where: {
      team_member_user_id: actionBy,
    },
    select: {
      team_member_id: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    const data = await tx.reseller_withdrawal_table.update({
      where: { reseller_withdrawal_id: withdrawalId },
      data: {
        reseller_withdrawal_status: status,
        reseller_withdrawal_action_by: memberId?.team_member_id,
        reseller_withdrawal_updated_at: new Date(),
      },
      select: {
        reseller_withdrawal_amount: true,
      },
    });
    if (status === "APPROVED") {
      await tx.reseller_transaction_table.create({
        data: {
          reseller_transaction_amount: data.reseller_withdrawal_amount,
          reseller_transaction_reseller_id: resellerId,
          reseller_transaction_type: "WITHDRAWAL",
          reseller_transaction_status: status,
        },
      });
    } else if (status === "REJECTED") {
      await tx.reseller_table.update({
        where: { reseller_id: resellerId },
        data: {
          reseller_withdrawable_earnings: {
            increment: data.reseller_withdrawal_amount,
          },
        },
      });
    }
  });
};
