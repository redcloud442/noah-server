import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { slugifyVariant } from "../../utils/function.js";
import prisma from "../../utils/prisma.js";
import { redis } from "../../utils/redis.js";
const resendClient = new Resend(process.env.RESEND_API_KEY);
export const productCollectionModel = async (params) => {
    const { search, take, skip, teamId } = params;
    const filter = {};
    const offset = (skip - 1) * take;
    if (search) {
        filter.product_category_name = {
            contains: search,
            mode: "insensitive",
        };
    }
    if (teamId) {
        filter.product_category_team_id = teamId;
    }
    const collections = await prisma.product_category_table.findMany({
        where: filter,
        orderBy: {
            product_category_created_at: "desc",
        },
        take,
        skip: offset,
    });
    const count = await prisma.product_category_table.count({
        where: {
            product_category_name: {
                contains: search,
                mode: "insensitive",
            },
            product_category_team_id: teamId,
        },
    });
    return {
        collections,
        count,
    };
};
export const productCreateModel = async (params) => {
    const { productCategoryName, productCategoryDescription, teamId, imageUrl } = params;
    const productCategory = await prisma.product_category_table.create({
        data: {
            product_category_name: productCategoryName,
            product_category_description: productCategoryDescription,
            product_category_team_id: teamId,
            product_category_image: imageUrl,
            product_category_slug: slugifyVariant(productCategoryName),
        },
        select: {
            product_category_id: true,
            product_category_name: true,
            product_category_description: true,
            product_category_team_id: true,
            product_category_created_at: true,
            product_category_updated_at: true,
            product_category_slug: true,
        },
    });
    return productCategory;
};
export const productVariantCreateModel = async (params) => {
    const productsCreated = [];
    await prisma.$transaction(async (tx) => {
        for (const product of params) {
            const { product_category_id, product_description, product_id, product_name, product_price, product_sale_percentage, product_slug, product_team_id, product_variants, product_size_guide_url, } = product;
            // Create product
            await tx.product_table.create({
                data: {
                    product_id: product_id.toString(),
                    product_category_id,
                    product_description,
                    product_name,
                    product_price,
                    product_sale_percentage,
                    product_slug,
                    product_team_id,
                    product_size_guide_url,
                },
            });
            // Create product variants
            await tx.product_variant_table.createMany({
                data: product_variants.map((variant) => ({
                    product_variant_id: variant.product_variant_id,
                    product_variant_product_id: product_id,
                    product_variant_color: variant.product_variant_color,
                    product_variant_slug: variant.product_variant_slug,
                })),
            });
            for (const variant of product_variants) {
                if (variant.variant_sizes.length > 0) {
                    await tx.variant_size_table.createMany({
                        data: variant.variant_sizes.map((size) => ({
                            variant_size_id: size.variant_size_id,
                            variant_size_variant_id: variant.product_variant_id,
                            variant_size_value: size.variant_size_value,
                            variant_size_quantity: size.variant_size_quantity,
                        })),
                    });
                }
                if (variant.variant_sample_images.length > 0) {
                    await tx.variant_sample_image_table.createMany({
                        data: variant.variant_sample_images.map((image) => ({
                            variant_sample_image_image_url: image.variant_sample_image_image_url,
                            variant_sample_image_product_variant_id: variant.product_variant_id,
                        })),
                    });
                }
            }
            // 📦 Save product info for later email sending
            productsCreated.push({
                product_name,
                product_description,
                product_slug,
                product_variants,
            });
        }
    });
    // ✅ After transaction success, send broadcast emails
    for (const product of productsCreated) {
        const firstImage = product.product_variants[0]?.variant_sample_images[0]
            ?.variant_sample_image_image_url ??
            "https://via.placeholder.com/400x300";
        const broadcast = await resendClient.broadcasts.create({
            audienceId: process.env.RESEND_AUDIENCE_ID,
            from: "Noir Clothing <support@help.noir-clothing.com>",
            subject: `New Arrival Alert: ${product.product_name ?? "Our Latest Drop"}`,
            html: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h2 style="color: #10B981; font-size: 24px;">New Product Launch!</h2>
            <p style="font-size: 18px;">Introducing: <strong>${product.product_name ?? "Our Latest Product"}</strong></p>
            <img src="${firstImage}" alt="${product.product_name ?? "Product Image"}" style="width: 100%; max-width: 400px; height: auto; margin: 20px 0; border-radius: 8px;" />
            <p style="font-size: 16px;">
              ${product.product_description ?? "Experience the perfect blend of style and comfort with our newest addition!"}
            </p>
            <p style="margin: 20px 0;">
              <a href="https://noir-clothing.com/shop" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; font-weight: bold; border-radius: 5px;">
                Shop Now
              </a>
            </p>
            <br />
            <p style="font-weight: bold;">– The Noir Clothing Team</p>
          </div>
        `,
        });
        await resendClient.broadcasts.send(broadcast.data?.id ?? "", {
            scheduledAt: "in 1 min",
        });
    }
    return { message: "Product variant created successfully" };
};
export const productVariantUpdateModel = async (params) => {
    await prisma.$transaction(async (tx) => {
        for (const product of params) {
            const { product_id, product_name, product_description, product_price, product_sale_percentage, product_slug, product_category_id, product_size_guide_url, product_team_id, product_variants, } = product;
            // 1. Update product_table
            await tx.product_table.update({
                where: { product_id },
                data: {
                    product_name,
                    product_description,
                    product_price,
                    product_sale_percentage,
                    product_slug,
                    product_category_id,
                    product_team_id,
                    product_size_guide_url,
                },
            });
            for (const variant of product_variants) {
                const { product_variant_id, product_variant_color, product_variant_slug, variant_sizes, variant_sample_images, } = variant;
                if (variant.product_variant_is_deleted) {
                    await tx.product_variant_table.update({
                        where: { product_variant_id: product_variant_id },
                        data: {
                            product_variant_is_deleted: true,
                        },
                    });
                    continue;
                }
                await tx.product_variant_table.upsert({
                    where: { product_variant_id },
                    update: {
                        product_variant_color,
                        product_variant_slug,
                    },
                    create: {
                        product_variant_id,
                        product_variant_color,
                        product_variant_slug,
                        product_variant_product_id: product_id,
                    },
                });
                await tx.variant_size_table.deleteMany({
                    where: {
                        variant_size_variant_id: product_variant_id,
                    },
                });
                await tx.variant_sample_image_table.deleteMany({
                    where: {
                        variant_sample_image_product_variant_id: product_variant_id,
                    },
                });
                if (variant_sizes.length > 0) {
                    await tx.variant_size_table.createMany({
                        data: variant_sizes.map((size) => ({
                            variant_size_id: size.variant_size_id,
                            variant_size_variant_id: product_variant_id,
                            variant_size_value: size.variant_size_value,
                            variant_size_quantity: size.variant_size_quantity,
                        })),
                    });
                }
                if (variant_sample_images.length > 0) {
                    await tx.variant_sample_image_table.createMany({
                        data: variant_sample_images.map((image) => ({
                            variant_sample_image_image_url: image.variant_sample_image_image_url,
                            variant_sample_image_product_variant_id: product_variant_id,
                        })),
                    });
                }
            }
        }
    });
    return { message: "Product and variants updated successfully" };
};
export const productCollectionSlugModel = async (params) => {
    const { collectionSlug, take, skip, search, teamId } = params;
    const filter = {};
    const offset = (skip - 1) * take;
    const productCategory = await prisma.product_category_table.findFirstOrThrow({
        where: {
            product_category_name: {
                contains: collectionSlug,
                mode: "insensitive",
            },
        },
    });
    if (teamId) {
        filter.product_team_id = teamId;
    }
    if (collectionSlug) {
        filter.product_category_id = productCategory.product_category_id;
    }
    const products = await prisma.product_table.findMany({
        where: filter,
        select: {
            product_id: true,
            product_name: true,
            product_price: true,
            product_sale_percentage: true,
            product_created_at: true,
            product_description: true,
            product_slug: true,
            product_variants: {
                select: {
                    product_variant_id: true,
                    product_variant_color: true,
                    product_variant_slug: true,
                    variant_sizes: {
                        select: {
                            variant_size_id: true,
                            variant_size_value: true,
                            variant_size_quantity: true,
                        },
                    },
                    variant_sample_images: {
                        select: {
                            variant_sample_image_image_url: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            product_created_at: "desc",
        },
        take,
        skip: offset,
    });
    const count = await prisma.product_table.count({
        where: filter,
    });
    return {
        data: products,
        count,
    };
};
export const productGetCategoriesModel = async () => {
    const cacheKey = "product-get-categories";
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const categories = await prisma.product_category_table.findMany({
        select: {
            product_category_id: true,
            product_category_name: true,
            product_category_description: true,
            product_category_image: true,
        },
        orderBy: {
            product_category_created_at: "desc",
        },
    });
    await redis.set(cacheKey, JSON.stringify(categories), { ex: 60 * 10 });
    return categories;
};
export const productGetAllProductModel = async (params) => {
    const { take, skip, search, teamId } = params;
    const filter = {};
    const offset = Math.max((skip - 1) * take, 0);
    if (search) {
        filter.product_variant_product = {
            product_name: {
                contains: search,
                mode: "insensitive",
            },
        };
    }
    if (teamId) {
        filter.product_variant_product = {
            product_team_id: teamId,
        };
        filter.product_variant_is_deleted = {
            equals: false,
        };
    }
    const products = await prisma.product_variant_table.findMany({
        where: filter,
        select: {
            product_variant_id: true,
            product_variant_color: true,
            product_variant_slug: true,
            product_variant_is_featured: true,
            product_variant_product: {
                select: {
                    product_id: true,
                    product_name: true,
                    product_price: true,
                    product_sale_percentage: true,
                    product_created_at: true,
                    product_slug: true,
                },
            },
            variant_sizes: {
                select: {
                    variant_size_id: true,
                    variant_size_value: true,
                    variant_size_quantity: true,
                },
            },
            variant_sample_images: {
                select: {
                    variant_sample_image_image_url: true,
                },
                take: 1,
            },
        },
        orderBy: {
            product_variant_product: {
                product_created_at: "desc",
            },
        },
        take,
        skip: offset,
    });
    const count = await prisma.product_variant_table.count({
        where: filter,
    });
    return {
        data: products,
        count,
    };
};
export const productSetFeaturedProductModel = async (params) => {
    const { productId } = params;
    const productVariant = await prisma.product_variant_table.findUnique({
        where: { product_variant_id: productId },
    });
    if (!productVariant) {
        throw new Error("Product variant not found");
    }
    await prisma.product_variant_table.update({
        where: { product_variant_id: productId },
        data: {
            product_variant_is_featured: true,
        },
    });
    return { message: "Product variant set as featured" };
};
export const productPublicModel = async (params) => {
    const { search, category, sort, take, skip, branch } = params;
    const filter = {};
    const sortFilter = {};
    const offset = (skip - 1) * take;
    if (search) {
        filter.product_name = { contains: search, mode: "insensitive" };
    }
    if (category) {
        filter.product_category_id = category;
    }
    if (sort) {
        if (sort === "newest") {
            sortFilter.product_created_at = "desc";
        }
        if (sort === "oldest") {
            sortFilter.product_created_at = "asc";
        }
        if (sort === "price_asc") {
            sortFilter.product_price = "asc";
        }
        if (sort === "price_desc") {
            sortFilter.product_price = "desc";
        }
        if (sort === "featured") {
            sortFilter.product_variants = {
                _count: "desc",
            };
        }
    }
    if (branch) {
        filter.product_team_id = branch;
    }
    const products = await prisma.product_table.findMany({
        where: {
            ...filter,
            product_variants: { some: { product_variant_is_deleted: false } },
        },
        orderBy: sortFilter,
        include: {
            product_variants: {
                where: {
                    product_variant_is_deleted: false,
                },
                include: {
                    variant_sample_images: true,
                    variant_sizes: true,
                },
            },
        },
        take,
        skip: offset,
    });
    const count = await prisma.product_table.count({
        where: {
            ...filter,
            product_variants: { some: { product_variant_is_deleted: false } },
        },
    });
    return {
        data: products,
        count,
        hasMore: count > offset + products.length,
    };
};
export const productGetAllProductCollectionsModel = async () => {
    const cacheKey = "product-get-all-product-collections";
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const [collections, freshDrops, featuredProducts] = await Promise.all([
        prisma.product_category_table.findMany({
            select: {
                product_category_id: true,
                product_category_name: true,
                product_category_description: true,
                product_category_image: true,
                product_category_slug: true,
            },
        }),
        prisma.product_variant_table.findMany({
            where: {
                product_variant_is_deleted: false,
            },
            select: {
                product_variant_id: true,
                product_variant_color: true,
                product_variant_slug: true,
                product_variant_product: {
                    select: {
                        product_id: true,
                        product_name: true,
                        product_slug: true,
                        product_description: true,
                    },
                },
                variant_sample_images: {
                    select: {
                        variant_sample_image_id: true,
                        variant_sample_image_image_url: true,
                    },
                    take: 1,
                },
            },
            orderBy: {
                product_variant_product: {
                    product_created_at: "desc",
                },
            },
            take: 5,
        }),
        prisma.product_variant_table.findMany({
            where: {
                product_variant_is_deleted: false,
                product_variant_is_featured: true,
            },
            select: {
                product_variant_id: true,
                product_variant_color: true,
                product_variant_slug: true,
                product_variant_product: {
                    select: {
                        product_id: true,
                        product_name: true,
                        product_slug: true,
                        product_description: true,
                    },
                },
                variant_sample_images: {
                    select: {
                        variant_sample_image_id: true,
                        variant_sample_image_image_url: true,
                    },
                    take: 1,
                },
            },
            orderBy: {
                product_variant_product: {
                    product_created_at: "desc",
                },
            },
            take: 5,
        }),
    ]);
    const returnData = {
        collections,
        freshDrops,
        featuredProducts,
    };
    await redis.set(cacheKey, JSON.stringify(returnData), { ex: 60 * 60 * 24 });
    return returnData;
};
