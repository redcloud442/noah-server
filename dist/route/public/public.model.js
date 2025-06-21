import prisma from "../../utils/prisma.js";
import { redis } from "../../utils/redis.js";
export const productPublicModel = async (params) => {
    const { search, category, sort, take, skip } = params;
    const filter = {};
    const sortFilter = {};
    const offset = (skip - 1) * take;
    const cacheKey = `product_public_${search}_${category}_${sort}_${take}_${skip}`;
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts) {
        return cachedProducts;
    }
    if (search) {
        filter.product_variant_product = {
            product_name: { contains: search, mode: "insensitive" },
        };
    }
    if (category) {
        filter.product_variant_product = {
            product_category_id: category,
        };
    }
    if (sort) {
        if (sort === "newest") {
            sortFilter.product_variant_product = {
                product_created_at: "desc",
            };
        }
        if (sort === "oldest") {
            sortFilter.product_variant_product = {
                product_created_at: "asc",
            };
        }
        if (sort === "price_asc") {
            sortFilter.product_variant_product = {
                product_price: "asc",
            };
        }
        if (sort === "price_desc") {
            sortFilter.product_variant_product = {
                product_price: "desc",
            };
        }
        if (sort === "featured") {
            sortFilter.product_variant_is_featured = "desc";
        }
    }
    // Fetch paginated product variants
    const products = await prisma.product_variant_table.findMany({
        where: {
            product_variant_is_deleted: false,
            ...filter,
        },
        include: {
            product_variant_product: true,
            variant_sample_images: true,
            variant_sizes: true,
        },
        orderBy: sortFilter,
        take,
        skip: offset,
    });
    // Build filter for product_table.count()
    const countWhere = {
        product_variants: {
            some: {
                product_variant_is_deleted: false,
            },
        },
    };
    if (search) {
        countWhere.product_name = {
            contains: search,
            mode: "insensitive",
        };
    }
    if (category) {
        countWhere.product_category_id = category;
    }
    const count = await prisma.product_table.count({
        where: countWhere,
    });
    const returnData = {
        data: products,
        count,
        hasMore: count > offset + products.length,
    };
    await redis.set(cacheKey, JSON.stringify(returnData), {
        ex: 60 * 5,
    });
    return returnData;
};
export const productGetAllProductOptionsModel = async () => {
    const cacheKey = `product_all_product_options`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const categories = await prisma.product_category_table.findMany();
    const teams = await prisma.team_table.findMany();
    const categoriesData = categories.map((item) => ({
        label: item.product_category_name,
        value: item.product_category_id,
    }));
    const teamsData = teams.map((item) => ({
        label: item.team_name,
        value: item.team_id,
    }));
    const returnData = {
        categories: categoriesData,
        teams: teamsData,
    };
    await redis.set(cacheKey, JSON.stringify(returnData), {
        ex: 60 * 5,
    });
    return returnData;
};
