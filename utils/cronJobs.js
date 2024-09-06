const cron = require("node-cron");

const prisma = require("../libs/prismaClient");

module.exports = {
  promotionCheck: () => {
    cron.schedule("0 */6 * * *", async function () {
      const products = await prisma.product.findMany();
      const promotions = await prisma.promotion.findMany();
      const validPromotionIds = products.map((data) => data.promotionId).filter((promotionId) => promotionId !== null);
      const validPromotion = promotions.filter((promotion) => new Date(promotion.endDate) < new Date());

      for (const promo of validPromotion) {
        await prisma.promotion.update({
          where: { id: promo.id },
          data: {
            isDeleted: true,
          },
        });
      }

      for (const promotionId of validPromotionIds) {
        const promotion = promotions.find((promotion) => promotion.id === promotionId);

        if (!promotion || new Date(promotion.endDate) < new Date()) {
          const productsToUpdate = products.filter((product) => product.promotionId === promotionId);

          for (const product of productsToUpdate) {
            await prisma.product.update({
              where: { id: product.id },
              data: {
                price: product.price / (1 - promotion.discount),
                promotionId: null,
              },
            });
          }
        }
      }
    });
  },
};
