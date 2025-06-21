import prisma from "../../utils/prisma.js";
export const resellerGetListModel = async (params) => {
    const { take, skip, teamMemberId } = params;
    const offset = take * (skip - 1);
    const resellers = await prisma.reseller_transaction_table.findMany({
        where: {
            reseller_transaction_reseller: {
                reseller_team_member_id: teamMemberId,
            },
        },
        take,
        skip: offset,
        orderBy: {
            reseller_transaction_created_at: "desc",
        },
    });
    const total = await prisma.reseller_transaction_table.count();
    return {
        data: resellers,
        total,
    };
};
export const resellerDashboardModel = async (params) => {
    const { resellerId } = params;
    const totalResellerSales = await prisma.order_table.count({
        where: {
            order_reseller_id: resellerId,
            order_status: "PAID",
        },
    });
    const todayResellerSales = await prisma.order_table.count({
        where: {
            order_reseller_id: resellerId,
            order_status: "PAID",
            order_created_at: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
        },
    });
    return {
        totalResellerSales,
        todayResellerSales,
    };
};
export const resellerOrdersModel = async (params) => {
    const { resellerId, take, skip, search, sortDirection, columnAccessor, dateFilter, } = params;
    const filters = {};
    const sort = {};
    if (search) {
        filters.order_number = { contains: search, mode: "insensitive" };
    }
    if (dateFilter.start && dateFilter.end) {
        filters.order_created_at = {
            gte: new Date(dateFilter.start),
            lte: new Date(dateFilter.end),
        };
    }
    if (sortDirection && columnAccessor) {
        const columnAccessorMapping = {
            orderNumber: "order_number",
            customerName: "order_first_name",
            orderDate: "order_created_at",
            orderStatus: "order_status",
        };
        sort[columnAccessorMapping[columnAccessor]] = sortDirection === "asc" ? "asc" : "desc";
    }
    const offset = take * skip + 1;
    const orders = await prisma.order_table.findMany({
        where: {
            order_reseller_id: resellerId,
        },
        select: {
            order_number: true,
            order_first_name: true,
            order_last_name: true,
            order_created_at: true,
            order_status: true,
        },
        take,
        skip: offset,
        orderBy: sort,
    });
    const formattedOrders = orders.map((order) => ({
        orderNumber: order.order_number,
        customerName: `${order.order_first_name} ${order.order_last_name}`,
        orderDate: order.order_created_at,
        orderStatus: order.order_status,
    }));
    const total = await prisma.order_table.count({
        where: {
            order_reseller_id: resellerId,
        },
    });
    return {
        data: formattedOrders,
        count: total,
    };
};
