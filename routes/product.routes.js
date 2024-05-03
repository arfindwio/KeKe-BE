const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { image } = require("../libs/multer");
const { getAllProducts, createProduct, getProductById, editProductById, deleteProductById } = require("../controllers/product.controllers");

router.get("/", getAllProducts);
router.post("/", Auth, checkRole(["Admin"]), image.single("image"), createProduct);
router.get("/:productId", getProductById);
router.put("/:productId", Auth, checkRole(["Admin"]), image.single("image"), editProductById);
router.delete("/:productId", Auth, checkRole(["Admin"]), deleteProductById);

module.exports = router;
