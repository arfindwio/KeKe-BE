const path = require("path");

const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const imagekit = require("../libs/imagekit");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createImage: catchAsync(async (req, res, next) => {
    try {
      const { categoryId, productId } = req.body;
      const file = req.file;
      let imageURL;

      if (!file) throw new CustomError(400, "Please provide image");

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      if (categoryId && categoryId !== "null") {
        const category = await prisma.category.findUnique({
          where: { id: Number(categoryId) },
        });

        if (!category) throw new CustomError(404, "Category not found");
      }

      if (productId && productId !== "null") {
        const product = await prisma.product.findUnique({
          where: { id: Number(productId) },
        });

        if (!product) throw new CustomError(404, "Product not found");
      }

      let newImage = await prisma.image.create({
        data: {
          image: imageURL,
          categoryId: categoryId || categoryId !== "null" ? Number(categoryId) : null,
          productId: productId || productId !== "null" ? Number(productId) : null,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create image successful",
        data: { newImage },
      });
    } catch (err) {
      next(err);
    }
  }),

  editImageById: catchAsync(async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const { categoryId, productId } = req.body;
      const file = req.file;
      let imageURL;

      const image = await prisma.image.findUnique({
        where: { id: Number(imageId) },
      });

      if (!image) throw new CustomError(404, "image Not Found");

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      if (categoryId && categoryId !== "null") {
        const category = await prisma.category.findUnique({
          where: { id: Number(categoryId) },
        });

        if (!category) throw new CustomError(404, "Category not found");
      }

      if (productId && productId !== "null") {
        const product = await prisma.product.findUnique({
          where: { id: Number(productId) },
        });

        if (!product) throw new CustomError(404, "Product not found");
      }

      let editedImage = await prisma.image.update({
        where: {
          id: Number(image.id),
        },
        data: {
          image: imageURL,
          categoryId: categoryId || categoryId !== "null" ? Number(categoryId) : null,
          productId: productId || productId !== "null" ? Number(productId) : null,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update image successful",
        data: { editedImage },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteImageById: catchAsync(async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const image = await prisma.image.findUnique({
        where: { id: Number(imageId) },
      });

      if (!image) throw new CustomError(404, "Image Not Found");

      const deletedImage = await prisma.image.delete({
        where: {
          id: Number(image.id),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete image successful",
        data: { deletedImage },
      });
    } catch (err) {
      next(err);
    }
  }),
};
