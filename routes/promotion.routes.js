const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllPromotions, createPromotion, editPromotionById, deletePromotionById } = require("../controllers/promotion.controllers");

router.get("/", Auth, checkRole(["Admin"]), getAllPromotions);
router.post("/", Auth, checkRole(["Admin"]), createPromotion);
router.put("/:promotionId", Auth, checkRole(["Admin"]), editPromotionById);
router.delete("/:promotionId", Auth, checkRole(["Admin"]), deletePromotionById);

module.exports = router;
