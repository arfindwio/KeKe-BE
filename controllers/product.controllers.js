const path = require("path");

const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { getPagination } = require("../utils/getPagination");
const { CustomError } = require("../utils/errorHandler");
const imagekit = require("../libs/imagekit");
const { formattedDate } = require("../utils/formattedDate");
const { calculatePredictedRating } = require("../utils/collaborativeFiltering");

module.exports = {
  getAllProducts: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const products = await prisma.product.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { productName: { contains: search, mode: "insensitive" } } : {},
        include: {
          category: {
            select: {
              categoryName: true,
            },
          },
          review: {
            select: {
              userRating: true,
            },
          },
        },
      });

      const totalProducts = await prisma.product.count({
        where: search ? { productName: { contains: search, mode: "insensitive" } } : {},
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
      const file = req.file;
      let imageURL;
      let finalPrice = price;

      if (!productName || !file || !price || !description || !stock || !categoryId) throw new CustomError(400, "Please provide productName, price, description, stock, categoryId and productImage");

      if (promotionId === "null") throw new CustomError(400, "promotionId cannot be null");

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category) throw new CustomError(404, "category Not Found");

      if (promotionId) {
        const promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId) },
        });

        if (!promotion) throw new CustomError(404, "Promotion not found");

        finalPrice = price - promotion.discount * price;
      }

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      let newProduct = await prisma.product.create({
        data: {
          productImage: imageURL,
          productName,
          price: Number(finalPrice),
          description,
          stock: Number(stock),
          categoryId: Number(category.id),
          promotionId: promotionId ? Number(promotionId) : null,
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

      const product = await prisma.product.update({
        where: {
          id: Number(productId),
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
          color: {
            select: {
              id: true,
              colorName: true,
            },
          },
          size: {
            select: {
              id: true,
              sizeName: true,
            },
          },
        },
      });

      if (!product) throw new CustomError(404, "product Not Found");

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
      const file = req.file;
      let imageURL;
      let finalPrice = price;

      if (!productName || !price || !description || !stock || !categoryId) throw new CustomError(400, "Please provide productName, price, description, stock, categoryId and productImage");

      if (promotionId === "null") throw new CustomError(400, "promotionId cannot be null");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category || !product) throw new CustomError(404, "category or product Not Found");

      if (promotionId) {
        const promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId) },
        });

        if (!promotion) throw new CustomError(404, "Promotion not found");

        finalPrice = price - promotion.discount * price;
      }

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      let editedProduct = await prisma.product.update({
        where: {
          id: Number(product.id),
        },
        data: {
          productImage: imageURL,
          productName,
          price: Number(finalPrice),
          description,
          stock: Number(stock),
          categoryId: Number(category.id),
          promotionId: promotionId ? Number(promotionId) : null,
          updatedAt: formattedDate(new Date()),
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
        where: { id: Number(productId) },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      const deletedProduct = await prisma.product.delete({
        where: {
          id: Number(productId),
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
            }
          : {},
        orderBy: [{ soldCount: "desc" }, { viewCount: "desc" }],
        include: {
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
        },
      });
      products.sort((a, b) => b.averageRating - a.averageRating);

      const remainingProducts = await prisma.product.findMany({
        where: {
          NOT: {
            id: {
              in: products.map((product) => product.id),
            },
          },
        },
        orderBy: [{ soldCount: "desc" }, { viewCount: "desc" }],
        include: {
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
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
        include: {
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
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
          NOT: {
            id: {
              in: filteredRecommendations.map((product) => product.id),
            },
          },
        },
        orderBy: [{ soldCount: "desc" }, { viewCount: "desc" }],
        include: {
          category: { select: { categoryName: true } },
          review: { select: { userRating: true } },
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
          promotionId: { not: null },
        },
        select: {
          productImage: true,
          productName: true,
          description: true,
          price: true,
          soldCount: true,
          stock: true,
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
