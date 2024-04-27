const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createDiscussion: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { userMessage } = req.body;

      if (!userMessage) throw new CustomError(400, "Please provide userMessage");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      let newDiscussion = await prisma.discussion.create({
        data: {
          userMessage,
          userId: Number(req.user.id),
          productId: Number(product.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create discussion successful",
        data: { newDiscussion },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteDiscussionById: catchAsync(async (req, res, next) => {
    try {
      const { discussionId } = req.params;
      const userId = req.user.id;

      const discussion = await prisma.discussion.findUnique({
        where: { id: Number(discussionId) },
      });

      if (!discussion) throw new CustomError(404, "discussion Not Found");

      if (req.user.role !== "Admin" && discussion.userId !== userId) throw new CustomError(403, "This is not your discussion chat");

      const deletedDiscussion = await prisma.discussion.delete({
        where: {
          id: Number(discussion.id),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete discussion successful",
        data: { deletedDiscussion },
      });
    } catch (err) {
      next(err);
    }
  }),
};
