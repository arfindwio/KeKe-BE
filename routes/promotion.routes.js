const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllPromotions, createPromotion, editPromotionById, deletePromotionById } = require("../controllers/promotion.controllers");

router.get("/", Auth, checkRole(["Owner", "Admin"]), getAllPromotions);
router.post("/", Auth, checkRole(["Owner", "Admin"]), createPromotion);
router.put("/:promotionId", Auth, checkRole(["Owner", "Admin"]), editPromotionById);
router.delete("/:promotionId", Auth, checkRole(["Owner", "Admin"]), deletePromotionById);

module.exports = router;
