const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllDiscussions: catchAsync(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      // Fetch all discussions with nested relations
      const allDiscussions = await prisma.discussion.findMany({
        where: { isDeleted: false },
        include: {
          user: {
            select: {
              role: true,
              userProfile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              productName: true,
            },
          },
          reply: {
            where: { isDeleted: false },
            orderBy: {
              id: "asc",
            },
            select: {
              id: true,
              replyMessage: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  role: true,
                  userProfile: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Sort discussions in memory based on the criteria
      const sortedDiscussions = allDiscussions.sort((a, b) => {
        const repliesA = a.reply;
        const repliesB = b.reply;

        // Sort by discussions with no replies first
        if (repliesA.length === 0 && repliesB.length === 0) {
          return b.id - a.id; // Sort by discussion ID if both have no replies
        }
        if (repliesA.length === 0) {
          return -1; // A has no replies, so A comes first
        }
        if (repliesB.length === 0) {
          return 1; // B has no replies, so B comes first
        }

        // Get the latest reply's role
        const latestReplyRoleA = repliesA[repliesA.length - 1].user.role;
        const latestReplyRoleB = repliesB[repliesB.length - 1].user.role;

        // Prioritize by role: User over Admin
        if (latestReplyRoleA === "User" && latestReplyRoleB !== "User") {
          return -1; // A has a User reply, so A comes first
        }
        if (latestReplyRoleA !== "User" && latestReplyRoleB === "User") {
          return 1; // B has a User reply, so B comes first
        }

        // If roles are the same or both have User/Admin replies, compare by reply array length
        if (repliesA.length !== repliesB.length) {
          return repliesB.length - repliesA.length; // Sort by reply array length descending
        }

        // If reply array lengths are the same, sort by discussion ID descending
        return b.id - a.id;
      });

      // Apply pagination to sorted discussions
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedDiscussions = sortedDiscussions.slice(startIndex, endIndex);

      // Total discussions for pagination
      const totalDiscussions = allDiscussions.length;

      const pagination = getPagination(req, totalDiscussions, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "Discussions retrieved successfully",
        data: { pagination, discussions: paginatedDiscussions },
      });
    } catch (err) {
      next(err);
    }
  }),

  getDiscussionsByProductId: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 5 } = req.query;

      const product = await prisma.product.findUnique({
        where: { id: Number(productId), isDeleted: false },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      const discussions = await prisma.discussion.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "asc" },
        where: { productId: Number(product.id), isDeleted: false },
        include: {
          user: {
            select: {
              id: true,
              userProfile: {
                select: {
                  fullName: true,
                  profilePicture: true,
                },
              },
            },
          },
          reply: {
            where: { isDeleted: false },
            select: {
              id: true,
              replyMessage: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  userProfile: {
                    select: {
                      fullName: true,
                      profilePicture: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const totalDiscussions = await prisma.discussion.count({
        where: { productId: Number(product.id) },
      });

      const pagination = getPagination(req, totalDiscussions, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "Discussions retrieved by id successfully",
        data: { pagination, discussions },
      });
    } catch (err) {
      next(err);
    }
  }),

  createDiscussion: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { userMessage } = req.body;

      if (!userMessage) throw new CustomError(400, "Please provide userMessage");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId), isDeleted: false },
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

      if (req.user.role === "User") {
        const users = await prisma.user.findMany({
          where: { role: "Admin" },
        });

        const notifications = users.map((user) => {
          return {
            title: "Discussion",
            message: `A new discussion has been created by ${req.user.userProfile.fullName} on the product ${product.productName}`,
            userId: Number(user.id),
            createdAt: formattedDate(new Date()),
            updatedAt: formattedDate(new Date()),
          };
        });

        await prisma.notification.createMany({
          data: notifications,
        });
      }

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
        where: { id: Number(discussionId), isDeleted: false },
        include: {
          reply: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!discussion) throw new CustomError(404, "discussion Not Found");

      if (req.user.role !== "Admin" && discussion.userId !== userId) throw new CustomError(403, "This is not your discussion chat");

      // if (discussion.reply) {
      //   await prisma.reply.deleteMany({
      //     where: { discussionId: Number(discussion.id) },
      //   });
      // }

      const deletedDiscussion = await prisma.discussion.update({
        where: {
          id: Number(discussion.id),
        },
        data: {
          isDeleted: true,
          updatedAt: formattedDate(new Date()),
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
