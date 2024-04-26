const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { createReviewProduct } = require("../controllers/review.controllers");

router.post("/:productId", Auth, checkRole(["User", "Admin"]), createReviewProduct);

module.exports = router;
