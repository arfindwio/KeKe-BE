const prisma = require("../libs/prismaClient");

const cosineSimilarity = async (productA, productB) => {
  const ratings = await prisma.review.findMany();

  const ratingsA = ratings.filter((rating) => rating.productId === productA.id);
  const ratingsB = ratings.filter((rating) => rating.productId === productB.productId);

  // Ambil userId dari ratingsB
  const userIdsA = new Set(ratingsA.map((rating) => rating.userId));
  const userIdsB = new Set(ratingsB.map((rating) => rating.userId));

  // Temukan objek dari ratingsA yang userId-nya ada di userIdsB
  const commonRatingsA = ratingsA.filter((rating) => userIdsB.has(rating.userId));
  const commonRatingsB = ratingsB.filter((rating) => userIdsA.has(rating.userId));

  const allRatings = [...commonRatingsA, ...commonRatingsB];

  const userRatingsProduct = allRatings.reduce((acc, rating) => {
    const { userId, userRating } = rating;
    if (!acc[userId]) {
      acc[userId] = 1;
    }
    acc[userId] *= userRating;
    return acc;
  }, {});

  const totalProduct = Object.values(userRatingsProduct).reduce((total, product) => total + product, 0);

  const magnitudeA = Math.sqrt(commonRatingsA.reduce((acc, rating) => acc + rating.userRating ** 2, 0));
  const magnitudeB = Math.sqrt(commonRatingsB.reduce((acc, rating) => acc + rating.userRating ** 2, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  } else {
    return totalProduct / (magnitudeA * magnitudeB);
  }
};

module.exports = {
  calculatePredictedRating: async (userRatings, product) => {
    try {
      let numerator = 0;
      let denominator = 0;

      for (const rating of userRatings) {
        const similarity = await cosineSimilarity(product, rating);
        numerator += similarity * rating.userRating;
        denominator += similarity;
      }

      return denominator === 0 ? 0 : numerator / denominator;
    } catch (error) {
      console.error("Error in calculating predicted rating:", error);
      throw error;
    }
  },
};
