const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { getPagination } = require("../utils/getPagination");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { calculatePredictedRating } = require("../utils/collaborativeFiltering");

module.exports = {
  getAllProducts: catchAsync(async (req, res, next) => {
    try {
      const { search, f, c, page = 1, limit = 10 } = req.query;

      let productsQuery = {
        where: { isDeleted: false },
        orderBy: [{ stock: "desc" }],
      };

      if (search) {
        productsQuery.where.OR = [{ productName: { contains: search, mode: "insensitive" } }];
      }

      if (f) {
        if (f.includes("newest")) {
          productsQuery.orderBy.unshift({ id: "asc" });
        }
        if (f.includes("populer")) {
          productsQuery.orderBy.unshift({ review: { _count: "desc" } }, { soldCount: "desc" });
        }
        if (f.includes("promo")) {
          productsQuery.where.promotionId = { not: null };
        }
      }

      if (c) {
        const categories = Array.isArray(c) ? c.map((category) => category.toLowerCase()) : [c.toLowerCase()];
        productsQuery.where.category = {
          categoryName: { in: categories, mode: "insensitive" },
        };
      }

      const products = await prisma.product.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: productsQuery.where,
        orderBy: productsQuery.orderBy,
        include: {
          category: {
            select: {
              categoryName: true,
            },
          },
          image: {
            orderBy: {
              id: "asc",
            },
            select: {
              id: true,
              image: true,
            },
          },
          size: {
            select: {
              id: true,
              sizeName: true,
            },
          },
          color: {
            select: {
              id: true,
              colorName: true,
            },
          },
          review: {
            select: {
              userRating: true,
            },
          },
          promotion: {
            select: {
              discount: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      const totalProducts = await prisma.product.count({
        where: productsQuery.where,
      });

      const pagination = getPagination(req, totalProducts, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all products successful",
        data: { pagination, products },
      });
    } catch (err) {
      next(err);
    }
  }),

  createProduct: catchAsync(async (req, res, next) => {
    try {
      const { productName, price, description, stock, categoryId, promotionId } = req.body;
      let finalPrice = price;

      if (!productName || !price || !description || !stock || !categoryId) throw new CustomError(400, "Please provide productName, price, description, stock, and categoryId ");

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId), isDeleted: false },
      });

      if (!category) throw new CustomError(404, "Category Not Found");

      if (promotionId && promotionId !== "null") {
        const promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId), isDeleted: false },
        });

        if (!promotion) throw new CustomError(404, "Promotion not found");

        finalPrice = price - promotion.discount * price;
      }

      let newProduct = await prisma.product.create({
        data: {
          productName,
          price: Number(finalPrice),
          description,
          stock: Number(stock),
          categoryId: Number(category.id),
          promotionId: promotionId && promotionId !== "null" ? Number(promotionId) : null,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create product successful",
        data: { newProduct },
      });
    } catch (err) {
      next(err);
    }
  }),

  getProductById: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;

      const productData = await prisma.product.findUnique({
        where: { id: Number(productId), isDeleted: false },
      });

      if (!productData) throw new CustomError(404, "product Not Found");

      const product = await prisma.product.update({
        where: {
          id: Number(productData.id),
        },
        data: {
          viewCount: { increment: 1 },
        },
        include: {
          category: {
            select: {
              categoryName: true,
            },
          },
          promotion: {
            select: {
              discount: true,
            },
          },
          image: {
            orderBy: {
              id: "asc",
            },
            select: {
              id: true,
              image: true,
            },
          },
          color: {
            orderBy: {
              id: "asc",
            },
            select: {
              id: true,
              colorName: true,
            },
          },
          size: {
            orderBy: {
              id: "asc",
            },
            select: {
              id: true,
              sizeName: true,
            },
          },
        },
      });

      res.status(200).json({
        status: true,
        message: "get product by id successful",
        data: { product },
      });
    } catch (err) {
      next(err);
    }
  }),

  editProductById: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { productName, price, description, stock, categoryId, promotionId } = req.body;

      if (!productName || !price || !description || !stock || !categoryId) throw new CustomError(400, "Please provide productName, price, description, stock, and categoryId ");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId), isDeleted: false },
        include: {
          promotion: {
            select: {
              discount: true,
            },
          },
        },
      });

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId), isDeleted: false },
      });

      if (!category || !product) throw new CustomError(404, "category or product Not Found");

      let finalPrice = Number(price);

      if (promotionId && promotionId !== "null") {
        const promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId), isDeleted: false },
        });

        if (!promotion) throw new CustomError(404, "Promotion not found");

        finalPrice = price - price * promotion.discount;
      }

      let editedProduct = await prisma.product.update({
        where: {
          id: Number(product.id),
        },
        data: {
          productName,
          price: Number(finalPrice),
          description,
          stock: Number(stock),
          categoryId: Number(category.id),
          promotionId: promotionId && promotionId !== "null" ? Number(promotionId) : null,
          updatedAt: formattedDate(new Date()),
          cart: {
            updateMany: {
              where: { productId: Number(product.id) },
              data: {
                promotionId: promotionId && promotionId !== "null" ? Number(promotionId) : null,
              },
            },
          },
        },
      });

      res.status(200).json({
        status: true,
        message: "update product successful",
        data: { editedProduct },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteProductById: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;

      const product = await prisma.product.findUnique({
        where: { id: Number(productId), isDeleted: false },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      const deletedProduct = await prisma.product.update({
        where: {
          id: Number(productId),
        },
        data: {
          isDeleted: true,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete product successful",
        data: { deletedProduct },
      });
    } catch (err) {
      next(err);
    }
  }),

  getProductsRecommendation: catchAsync(async (req, res, next) => {
    try {
      let { search } = req.query;

      search = search ? search.trim() : "";

      let products;

      products = await prisma.product.findMany({
        where: search
          ? {
              productName: { contains: search, mode: "insensitive" },
              isDeleted: false,
            }
          : { isDeleted: false },
        orderBy: [{ soldCount: "desc" }, { viewCount: "desc" }],
        include: {
          image: {
            orderBy: {
              id: "asc",
            },
            select: { image: true },
          },
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
          promotion: { select: { discount: true } },
        },
      });
      products.sort((a, b) => b.averageRating - a.averageRating);

      const remainingProducts = await prisma.product.findMany({
        where: {
          isDeleted: false,
          NOT: {
            id: {
              in: products.map((product) => product.id),
            },
          },
        },
        orderBy: [{ soldCount: "desc" }, { viewCount: "desc" }],
        include: {
          image: {
            orderBy: {
              id: "asc",
            },
            select: { image: true },
          },
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
          promotion: { select: { discount: true } },
        },
      });
      products = products.concat(remainingProducts);

      res.status(200).json({
        status: true,
        message: "show all products recommendation successful",
        data: { products },
      });
    } catch (err) {
      next(err);
    }
  }),

  getProductsRecommendationUser: catchAsync(async (req, res, next) => {
    try {
      const ratings = await prisma.review.findMany();
      const products = await prisma.product.findMany({
        where: { isDeleted: false },
        include: {
          image: {
            orderBy: {
              id: "asc",
            },
            select: { image: true },
          },
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
          promotion: { select: { discount: true } },
        },
      });
      const userRatings = ratings.filter((rating) => rating.userId === req.user.id);

      const recommendationPromises = products.map(async (product) => {
        if (!userRatings.some((rating) => rating.productId === product.id)) {
          const predictedRating = await calculatePredictedRating(userRatings, product);
          // Hitung rata-rata rating produk
          const totalRating = product.review.reduce((acc, review) => acc + review.userRating, 0);
          const averageRating = totalRating / product.review.length || 0; // Hindari pembagian dengan nol
          return { ...product, predictedRating, averageRating };
        }
      });

      const recommendationResults = await Promise.all(recommendationPromises);
      let filteredRecommendations = recommendationResults.filter(Boolean);

      // Urutkan berdasarkan predictedRating dan averageRating
      filteredRecommendations.sort((a, b) => {
        // Jika predictedRating sama, urutkan berdasarkan averageRating
        if (a.predictedRating === b.predictedRating) {
          return b.averageRating - a.averageRating;
        }
        // Urutkan secara descending berdasarkan predictedRating
        return b.predictedRating - a.predictedRating;
      });

      const remainingProducts = await prisma.product.findMany({
        where: {
          isDeleted: false,
          NOT: {
            id: {
              in: filteredRecommendations.map((product) => product.id),
            },
          },
        },
        orderBy: [{ soldCount: "desc" }, { viewCount: "desc" }],
        include: {
          image: {
            orderBy: {
              id: "asc",
            },
            select: { image: true },
          },
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
          promotion: { select: { discount: true } },
        },
      });
      filteredRecommendations = filteredRecommendations.concat(remainingProducts);

      filteredRecommendations.map((product) => {
        delete product.predictedRating;
        delete product.averageRating;
      });

      res.status(200).json({
        status: true,
        message: "show all products recommendation successful",
        data: { products: filteredRecommendations },
      });
    } catch (err) {
      next(err);
    }
  }),

  getSpecialOfferProduct: catchAsync(async (req, res, next) => {
    try {
      const product = await prisma.product.findFirst({
        where: {
          isDeleted: false,
          promotionId: { not: null },
        },
        select: {
          id: true,
          productName: true,
          description: true,
          price: true,
          soldCount: true,
          stock: true,
          image: {
            orderBy: {
              id: "asc",
            },
            select: {
              image: true,
            },
          },
          size: {
            select: {
              id: true,
              sizeName: true,
            },
          },
          color: {
            select: {
              id: true,
              colorName: true,
            },
          },
          review: {
            select: {
              userRating: true,
            },
          },
          promotion: {
            select: {
              discount: true,
              endDate: true,
            },
          },
        },
      });

      if (!product) throw new CustomError(404, "No special offer product found");

      res.status(200).json({
        status: true,
        message: "Show special offer product successful",
        data: { product },
      });
    } catch (err) {
      next(err);
    }
  }),
};
