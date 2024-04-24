const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllSizes: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const sizes = await prisma.size.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { sizeName: { contains: search, mode: "insensitive" } } : {},
      });

      const totalSizes = await prisma.size.count({
        where: search ? { sizeName: { contains: search, mode: "insensitive" } } : {},
      });

      const pagination = getPagination(req, totalSizes, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all sizes successful",
        data: { pagination, sizes },
      });
    } catch (err) {
      next(err);
    }
  }),

  createSize: catchAsync(async (req, res, next) => {
    try {
      const { sizeName, productId } = req.body;

      if (!sizeName || !productId) throw new CustomError(400, "Please provide sizeName and productId");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      let newSize = await prisma.size.create({
        data: {
          sizeName,
          productId: product.id,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create size successful",
        data: { newSize },
      });
    } catch (err) {
      next(err);
    }
  }),

  getSizesByProductId: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { search, page = 1, limit = 10 } = req.query;

      const sizes = await prisma.size.findMany({
        where: { productId: Number(productId) },
      });

      res.status(200).json({
        status: true,
        message: "show all sizes successful",
        data: { sizes },
      });
    } catch (err) {
      next(err);
    }
  }),

  editSizeById: catchAsync(async (req, res, next) => {
    try {
      const { sizeId } = req.params;
      const { sizeName, productId } = req.body;

      if (!sizeName || !productId) throw new CustomError(400, "Please provide sizeName and productId");

      const size = await prisma.size.findUnique({
        where: { id: Number(sizeId) },
      });

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!size || !product) throw new CustomError(404, "size or product Not Found");

      let editedSize = await prisma.size.update({
        where: {
          id: Number(size.id),
        },
        data: {
          sizeName,
          productId: Number(product.id),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update size successful",
        data: { editedSize },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteSize: catchAsync(async (req, res, next) => {
    try {
      const { sizeId } = req.params;

      const size = await prisma.size.findUnique({
        where: { id: Number(sizeId) },
      });

      if (!size) throw new CustomError(404, "size Not Found");

      const deletedSize = await prisma.size.delete({
        where: {
          id: Number(size.id),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete size successful",
        data: { deletedSize },
      });
    } catch (err) {
      next(err);
    }
  }),
};
