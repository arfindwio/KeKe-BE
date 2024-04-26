const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createReviewProduct: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { userRating, userComment } = req.body;

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
          id: Number(req.user.id),
          productId: Number(product.id),
        },
      });

      if (paymentsUser.length === reviewsUser.length) throw new CustomError(403, "You cannot review");

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
        message: "Notifications retrieved successfully",
        data: { newReview },
      });
    } catch (err) {
      next(err);
    }
  }),
};
