const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllColors: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const colors = await prisma.color.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { colorName: { contains: search, mode: "insensitive" } } : {},
      });

      const totalColors = await prisma.color.count({
        where: search ? { colorName: { contains: search, mode: "insensitive" } } : {},
      });

      const pagination = getPagination(req, totalColors, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all colors successful",
        data: { pagination, colors },
      });
    } catch (err) {
      next(err);
    }
  }),

  createColor: catchAsync(async (req, res, next) => {
    try {
      const { colorName, productId } = req.body;

      if (!colorName || !productId) throw new CustomError(400, "Please provide colorName and productId");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) throw new CustomError(404, "product Not Found");

      let newColor = await prisma.color.create({
        data: {
          colorName,
          productId: product.id,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create color successful",
        data: { newColor },
      });
    } catch (err) {
      next(err);
    }
  }),

  getColorsByProductId: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;

      const colors = await prisma.color.findMany({
        where: { productId: Number(productId) },
      });

      res.status(200).json({
        status: true,
        message: "show all colors successful",
        data: { colors },
      });
    } catch (err) {
      next(err);
    }
  }),

  editColorById: catchAsync(async (req, res, next) => {
    try {
      const { colorId } = req.params;
      const { colorName, productId } = req.body;

      if (!colorName || !productId) throw new CustomError(400, "Please provide colorName and productId");

      const color = await prisma.color.findUnique({
        where: { id: Number(colorId) },
      });

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!color || !product) throw new CustomError(404, "color or product Not Found");

      let editedColor = await prisma.color.update({
        where: {
          id: Number(color.id),
        },
        data: {
          colorName,
          productId: Number(product.id),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update color successful",
        data: { editedColor },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteColor: catchAsync(async (req, res, next) => {
    try {
      const { colorId } = req.params;

      const color = await prisma.color.findUnique({
        where: { id: Number(colorId) },
      });

      if (!color) throw new CustomError(404, "color Not Found");

      const deletedColor = await prisma.color.delete({
        where: {
          id: Number(color.id),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete color successful",
        data: { deletedColor },
      });
    } catch (err) {
      next(err);
    }
  }),
};
