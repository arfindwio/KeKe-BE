const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllCartsByAuth, createCartByProductId, editCartById, deleteCartById } = require("../controllers/cart.controllers");

router.get("/", Auth, checkRole(["Owner", "Admin", "User"]), getAllCartsByAuth);
router.post("/:productId", Auth, checkRole(["Owner", "Admin", "User"]), createCartByProductId);
router.put("/:cartId", Auth, checkRole(["Owner", "Admin", "User"]), editCartById);
router.delete("/:cartId", Auth, checkRole(["Owner", "Admin", "User"]), deleteCartById);

module.exports = router;
