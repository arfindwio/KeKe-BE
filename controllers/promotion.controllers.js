const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllPromotions: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const promotions = await prisma.promotion.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { discount: { contains: search, mode: "insensitive" } } : {},
      });

      const totalPromotions = await prisma.airport.count({
        where: search ? { discount: { contains: search, mode: "insensitive" } } : {},
      });

      const pagination = getPagination(req, totalPromotions, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all promotions successful",
        data: { pagination, promotions },
      });
    } catch (err) {
      next(err);
    }
  }),

  createPromotion: catchAsync(async (req, res, next) => {
    try {
      const { discount, startDate, endDate } = req.body;

      if (!discount || !startDate || !endDate) throw new CustomError(400, "All fields must be filled");

      let formattedStartDate = formattedDate(startDate);
      let formattedEndDate = formattedDate(endDate);

      const newPromotion = await prisma.promotion.create({
        data: {
          discount,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      const users = await prisma.user.findMany();

      const notifications = users.map((user) => {
        return {
          title: "Promo",
          message: `Discount ${discount * 100}% is valid from ${formattedStartDate} until ${formattedEndDate}`,
          userId: Number(user.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        };
      });

      await prisma.notification.createMany({
        data: notifications,
      });

      res.status(201).json({
        status: true,
        message: "Promotion created successfully",
        data: { newPromotion },
      });
    } catch (err) {
      next(err);
    }
  }),

  editPromotionById: catchAsync(async (req, res, next) => {
    try {
      const { promotionId } = req.params;
      const { discount, startDate, endDate } = req.body;

      if (!discount || !startDate || !endDate) throw new CustomError(400, "Please provide discount, startDate, and endDate");

      const promotion = await prisma.promotion.findUnique({
        where: { id: Number(promotionId) },
      });

      if (!promotion) throw new CustomError(404, "Promotion not found");

      let formattedStartDate = formattedDate(startDate);
      let formattedEndDate = formattedDate(endDate);

      const updatedPromotion = await prisma.promotion.update({
        where: { id: Number(promotion.id) },
        data: {
          discount,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "Promotion edited successfully",
        data: { updatedPromotion },
      });
    } catch (err) {
      next(err);
    }
  }),

  deletePromotionById: catchAsync(async (req, res, next) => {
    try {
      const { promotionId } = req.params;

      const promotion = await prisma.promotion.findUnique({
        where: { id: Number(promotionId) },
      });

      if (!promotion) throw new CustomError(404, "Promotion not found");

      const deletedPromotion = await prisma.promotion.delete({
        where: { id: Number(promotion.id) },
      });

      res.status(200).json({
        status: true,
        message: "Promotion deleted successfully",
        data: { deletedPromotion },
      });
    } catch (err) {
      next(err);
    }
  }),
};
