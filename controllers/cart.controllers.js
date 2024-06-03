const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  getAllCartsByAuth: catchAsync(async (req, res, next) => {
    try {
      const carts = await prisma.cart.findMany({
        where: { userId: Number(req.user.id), paymentId: null },
        orderBy: { id: "asc" },
        include: {
          product: {
            select: {
              productName: true,
              productImage: true,
              price: true,
              stock: true,
              promotion: {
                select: {
                  discount: true,
                },
              },
            },
          },
          color: {
            select: {
              colorName: true,
            },
          },
          size: {
            select: {
              sizeName: true,
            },
          },
        },
      });

      res.status(200).json({
        status: true,
        message: "show all carts successful",
        data: { carts },
      });
    } catch (err) {
      next(err);
    }
  }),

  createCartByProductId: catchAsync(async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { note, sizeId, colorId } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
        include: {
          size: true,
          color: true,
        },
      });

      if (!product || !product.size.find((s) => s.id === Number(sizeId)) || !product.color.find((c) => c.id === Number(colorId))) {
        throw new CustomError(404, "Product, size, or color not found.");
      }

      let newCart = await prisma.cart.findFirst({
        where: {
          productId: Number(productId),
          sizeId: Number(sizeId),
          colorId: Number(colorId),
          paymentId: null,
        },
      });

      if (newCart) {
        newCart = await prisma.cart.update({
          where: {
            id: Number(newCart.id),
          },
          data: {
            note,
            quantity: { increment: 1 },
            updatedAt: formattedDate(new Date()),
          },
        });
      } else {
        newCart = await prisma.cart.create({
          data: {
            quantity: 1,
            note,
            sizeId: Number(sizeId),
            colorId: Number(colorId),
            productId: Number(productId),
            userId: Number(req.user.id),
            createdAt: formattedDate(new Date()),
            updatedAt: formattedDate(new Date()),
          },
        });
      }

      res.status(201).json({
        status: true,
        message: "Create cart successful",
        data: { newCart },
      });
    } catch (err) {
      next(err);
    }
  }),

  editCartById: catchAsync(async (req, res, next) => {
    try {
      const { cartId } = req.params;
      const { quantity, note } = req.body;

      if (!quantity) throw new CustomError(400, "Please provide quantity");

      const cart = await prisma.cart.findUnique({
        where: { id: Number(cartId) },
      });

      if (!cart) throw new CustomError(404, "cart Not Found");

      let editedCart = await prisma.cart.update({
        where: {
          id: Number(cart.id),
        },
        data: {
          quantity,
          note,
          productId: Number(cart.productId),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update cart successful",
        data: { editedCart },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteCartById: catchAsync(async (req, res, next) => {
    try {
      const { cartId } = req.params;

      const cart = await prisma.cart.findUnique({
        where: { id: Number(cartId) },
      });

      if (!cart) throw new CustomError(404, "cart Not Found");

      const deletedCart = await prisma.cart.delete({
        where: {
          id: Number(cart.id),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete cart successful",
        data: { deletedCart },
      });
    } catch (err) {
      next(err);
    }
  }),
};
