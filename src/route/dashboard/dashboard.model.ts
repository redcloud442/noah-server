import { endOfMonth, startOfMonth } from "date-fns";
import type { typeDashboardSchema } from "../../schema/schema.js";
import prisma from "../../utils/prisma.js";

export const dashboardModel = async (params: typeDashboardSchema) => {
  const now = new Date();

  const { start, end } = params.dateFilter;

  const startDate = start
    ? new Date(new Date(start).setHours(0, 0, 0, 0)) // 12:00 AM
    : new Date(now.setHours(0, 0, 0, 0));

  const endDate = end
    ? new Date(new Date(end).setHours(23, 59, 59, 999)) // 11:59:59 PM
    : new Date(now.setHours(23, 59, 59, 999));

  const [dailySales, monthlySales, totalSales] = await Promise.all([
    prisma.order_table.aggregate({
      _sum: { order_total: true },
      where: {
        order_created_at: {
          gte: startDate,
          lte: endDate,
        },
        order_status: {
          in: ["PAID", "SHIPPED"],
        },
      },
    }),
    prisma.order_table.aggregate({
      _sum: { order_total: true },
      where: {
        order_created_at: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
        order_status: {
          in: ["PAID", "SHIPPED"],
        },
      },
    }),
    prisma.order_table.aggregate({
      _sum: { order_total: true },
      where: {
        order_status: {
          in: ["PAID", "SHIPPED"],
        },
      },
    }),
  ]);

  const totalBranches = await prisma.team_table.count();

  const [dailyWithdrawals, monthlyWithdrawals, totalWithdrawals] =
    await Promise.all([
      prisma.reseller_withdrawal_table.aggregate({
        _sum: { reseller_withdrawal_amount: true },
        where: {
          reseller_withdrawal_status: "APPROVED",
          reseller_withdrawal_updated_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.reseller_withdrawal_table.aggregate({
        _sum: { reseller_withdrawal_amount: true },
        where: {
          reseller_withdrawal_status: "APPROVED",
          reseller_withdrawal_updated_at: {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          },
        },
      }),
      prisma.reseller_withdrawal_table.aggregate({
        _sum: { reseller_withdrawal_amount: true },
      }),
    ]);

  return {
    sales: {
      daily: dailySales._sum.order_total || 0,
      monthly: monthlySales._sum.order_total || 0,
      total: totalSales._sum.order_total || 0,
      currentDate: new Date(),
    },
    branches: {
      total: totalBranches,
    },
    withdrawals: {
      daily: dailyWithdrawals._sum.reseller_withdrawal_amount || 0,
      monthly: monthlyWithdrawals._sum.reseller_withdrawal_amount || 0,
      total: totalWithdrawals._sum.reseller_withdrawal_amount || 0,
      currentDate: new Date(),
    },
  };
};
