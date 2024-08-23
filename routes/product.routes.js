const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllProducts, createProduct, getProductById, editProductById, deleteProductById, getProductsRecommendation, getProductsRecommendationUser, getSpecialOfferProduct } = require("../controllers/product.controllers");

router.get("/", getAllProducts);
router.post("/", Auth, checkRole(["Owner", "Admin"]), createProduct);
router.get("/:productId", getProductById);
router.put("/:productId", Auth, checkRole(["Owner", "Admin"]), editProductById);
router.delete("/:productId", Auth, checkRole(["Owner", "Admin"]), deleteProductById);
router.get("/featured/recommendation", getProductsRecommendation);
router.get("/featured/recommendation-user", Auth, checkRole(["Owner", "Admin", "User"]), getProductsRecommendationUser);
router.get("/featured/specialOffer", getSpecialOfferProduct);

module.exports = router;
