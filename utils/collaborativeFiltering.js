const prisma = require("../libs/prismaClient");

const cosineSimilarity = async (productA, productB) => {
  const ratings = await prisma.review.findMany();

  const ratingsA = ratings.filter((rating) => rating.productId === productA.id);
  const ratingsB = ratings.filter((rating) => rating.productId === productB.productId);

  const vectorA = ratingsA.map((rating) => rating.userRating);
  const vectorB = ratingsB.map((rating) => rating.userRating);

  const minLength = Math.min(vectorA.length, vectorB.length);
  const dotProduct = vectorA.slice(0, minLength).reduce((acc, ratingA, index) => acc + ratingA * vectorB[index], 0);

  const magnitudeA = Math.sqrt(vectorA.reduce((acc, rating) => acc + rating ** 2, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((acc, rating) => acc + rating ** 2, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  } else {
    return dotProduct / (magnitudeA * magnitudeB);
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

      console.log(numerator / denominator);
      return denominator === 0 ? 0 : numerator / denominator;
    } catch (error) {
      console.error("Error in calculating predicted rating:", error);
      throw error; // Rethrow the error to propagate it upwards
    }
  },
};
