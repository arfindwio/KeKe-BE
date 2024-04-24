const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllCartsByAuth, createCartByProductId, editCartById, deleteCartById } = require("../controllers/cart.controllers");

router.get("/", Auth, checkRole(["User", "Admin"]), getAllCartsByAuth);
router.post("/:productId", Auth, checkRole(["User", "Admin"]), createCartByProductId);
router.put("/:cartId", Auth, checkRole(["User", "Admin"]), editCartById);
router.delete("/:cartId", Auth, checkRole(["User", "Admin"]), deleteCartById);

module.exports = router;
