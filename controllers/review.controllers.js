const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getReviewsByProductId: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 6 } = req.query;

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      const reviews = await prisma.review.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: { productId: Number(product.id) },
        include: {
          user: {
            select: {
              userProfile: {
                select: {
                  fullName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      const totalReviews = await prisma.review.count({
        where: { productId: Number(product.id) },
      });

      const pagination = getPagination(req, totalReviews, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "Reviews retrieved successfully",
        data: { pagination, reviews },
      });
    } catch (err) {
      next(err);
    }
  }),

  createReviewProduct: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { userRating, userComment } = req.body;

      if (!userRating || !userComment) throw new CustomError(400, "Please provide userRating and userComment");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      const paymentsUser = await prisma.payment.findMany({
        where: {
          userId: Number(req.user.id),
          cart: { some: { product: { id: Number(product.id) } } },
          deliveryStatus: "Shipped",
        },
      });

      const reviewsUser = await prisma.review.findMany({
        where: {
          userId: Number(req.user.id),
          productId: Number(product.id),
        },
      });

      if (paymentsUser.length <= reviewsUser.length) throw new CustomError(403, "You cannot review");

      const newReview = await prisma.review.create({
        data: {
          userRating: Number(userRating),
          userComment,
          userId: Number(req.user.id),
          productId: Number(product.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create review successfully",
        data: { newReview },
      });
    } catch (err) {
      next(err);
    }
  }),
};
