const prisma = require("../libs/prismaClient");

// Function to compute the cosine similarity between two products based on user ratings
const cosineSimilarity = async (productA, productB) => {
  // Fetch all reviews from the database
  const ratings = await prisma.review.findMany();

  // Filter reviews specific to productA and productB
  const ratingsA = ratings.filter((rating) => rating.productId === productA.id);
  const ratingsB = ratings.filter((rating) => rating.productId === productB.productId);

  // Get unique user IDs who rated productA and productB
  const userIdsA = new Set(ratingsA.map((rating) => rating.userId));
  const userIdsB = new Set(ratingsB.map((rating) => rating.userId));

  // Find common ratings by users who rated both products
  const commonRatingsA = ratingsA.filter((rating) => userIdsB.has(rating.userId));
  const commonRatingsB = ratingsB.filter((rating) => userIdsA.has(rating.userId));

  // Combine the ratings into a single array
  const allRatings = [...commonRatingsA, ...commonRatingsB];

  // Compute user ratings product, where userRating is weighted
  const userRatingsProduct = allRatings.reduce((acc, rating) => {
    const { userId, userRating } = rating;
    if (!acc[userId]) {
      acc[userId] = 1;
    }
    acc[userId] *= userRating;
    return acc;
  }, {});

  // Calculate the total product of user ratings
  const totalProduct = Object.values(userRatingsProduct).reduce((total, product) => total + product, 0);

  // Compute magnitudes for productA and productB
  const magnitudeA = Math.sqrt(commonRatingsA.reduce((acc, rating) => acc + rating.userRating ** 2, 0));
  const magnitudeB = Math.sqrt(commonRatingsB.reduce((acc, rating) => acc + rating.userRating ** 2, 0));

  // Return cosine similarity or 0 if either magnitude is zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  } else {
    return totalProduct / (magnitudeA * magnitudeB);
  }
};

module.exports = {
  // Function to calculate the predicted rating for a product based on user ratings
  calculatePredictedRating: async (userRatings, product) => {
    try {
      let numerator = 0;
      let denominator = 0;

      // Iterate over user ratings to compute weighted sum and similarity
      for (const rating of userRatings) {
        const similarity = await cosineSimilarity(product, rating);
        numerator += similarity * rating.userRating;
        denominator += similarity;
      }

      // Return the predicted rating or 0 if denominator is zero
      return denominator === 0 ? 0 : numerator / denominator;
    } catch (error) {
      console.error("Error in calculating predicted rating:", error);
      throw error;
    }
  },
};
