// controllers/category.controllers.js
const path = require("path");

const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { getPagination } = require("../utils/getPagination");
const { CustomError } = require("../utils/errorHandler");
const imagekit = require("../libs/imagekit");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  getAllCategories: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const categories = await prisma.category.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { categoryName: { contains: search, mode: "insensitive" } } : {},
      });

      const totalCategories = await prisma.category.count({
        where: search ? { categoryName: { contains: search, mode: "insensitive" } } : {},
      });

      const pagination = getPagination(req, totalCategories, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all category successful",
        data: { pagination, categories },
      });
    } catch (err) {
      next(err);
    }
  }),

  createCategory: catchAsync(async (req, res, next) => {
    try {
      const { categoryName } = req.body;
      const file = req.file;
      let imageURL;

      if (!categoryName || !file) throw new CustomError(400, "Please provide categoryName and categoryImage");

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      let newCategory = await prisma.category.create({
        data: {
          categoryImage: imageURL,
          categoryName,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create category successful",
        data: { newCategory },
      });
    } catch (err) {
      next(err);
    }
  }),

  editCategoryById: catchAsync(async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { categoryName } = req.body;
      const file = req.file;
      let imageURL;

      if (!categoryName) throw new CustomError(400, "Please provide categoryName");

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category) throw new CustomError(404, "category Not Found");

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      let editedCategory = await prisma.category.update({
        where: {
          id: Number(category.id),
        },
        data: {
          categoryImage: imageURL,
          categoryName,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update category successful",
        data: { editedCategory },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteCategoryById: catchAsync(async (req, res, next) => {
    try {
      const { categoryId } = req.params;

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category) throw new CustomError(404, "Category Not Found");

      const deletedCategory = await prisma.category.delete({
        where: {
          id: Number(category.id),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete category successful",
        data: { deletedCategory },
      });
    } catch (err) {
      next(err);
    }
  }),
};
