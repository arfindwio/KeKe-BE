const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createReply: catchAsync(async (req, res, next) => {
    try {
      const { discussionId } = req.params;
      const { replyMessage } = req.body;

      if (!replyMessage) throw new CustomError(400, "Please provide replyMessage");

      const discussion = await prisma.discussion.findUnique({
        where: { id: Number(discussionId), isDeleted: false },
      });

      if (!discussion) throw new CustomError(404, "discussion Not Found");

      let newReply = await prisma.reply.create({
        data: {
          replyMessage,
          userId: Number(req.user.id),
          discussionId: Number(discussion.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create reply successful",
        data: { newReply },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteReplyById: catchAsync(async (req, res, next) => {
    try {
      const { replyId } = req.params;
      const userId = req.user.id;

      let reply = await prisma.reply.findUnique({
        where: { id: Number(replyId), isDeleted: false },
      });

      if (!reply) throw new CustomError(404, "Reply not found");

      if ((req.user.role !== "Owner" || req.user.role !== "Admin") && reply.userId !== userId) throw new CustomError(403, "This is not your reply chat");

      const deletedReply = await prisma.reply.update({
        where: {
          id: Number(reply.id),
        },
        data: {
          isDeleted: true,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "Delete reply successful",
        data: { deletedReply },
      });
    } catch (err) {
      next(err);
    }
  }),
};
