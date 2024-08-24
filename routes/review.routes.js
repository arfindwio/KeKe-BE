const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getReviewsByProductId, createReviewProduct } = require("../controllers/review.controllers");

router.get("/:productId", getReviewsByProductId);
router.post("/:productId", Auth, checkRole(["Owner", "Admin", "User"]), createReviewProduct);

module.exports = router;
