const path = require("path");

const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { getPagination } = require("../utils/getPagination");
const { CustomError } = require("../utils/errorHandler");
const imagekit = require("../libs/imagekit");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  getAllProducts: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const products = await prisma.product.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { productName: { contains: search, mode: "insensitive" } } : {},
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
      const { productName, price, description, stock, categoryId } = req.body;
      const file = req.file;
      let imageURL;

      if (!productName || !file || !price || !description || !stock || !categoryId) throw new CustomError(400, "Please provide productName, price, description, stock, categoryId and productImage");

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

      let newProduct = await prisma.product.create({
        data: {
          productImage: imageURL,
          productName,
          price: Number(price),
          description,
          stock: Number(stock),
          categoryId: category.id,
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

  editProductById: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { productName, price, description, stock, categoryId } = req.body;
      const file = req.file;
      let imageURL;

      if (!productName || !price || !description || !stock || !categoryId) throw new CustomError(400, "Please provide productName, price, description, stock, categoryId and productImage");

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category || !product) throw new CustomError(404, "category or product Not Found");

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
          price: Number(price),
          description,
          stock: Number(stock),
          categoryId: Number(product.id),
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
};
