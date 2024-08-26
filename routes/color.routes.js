const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllColors, createColor, getColorsByProductId, editColorById, deleteColorById } = require("../controllers/color.controllers");

router.get("/", Auth, checkRole(["Owner", "Admin"]), getAllColors);
router.post("/", Auth, checkRole(["Owner", "Admin"]), createColor);
router.get("/:productId", getColorsByProductId);
router.put("/:colorId", Auth, checkRole(["Owner", "Admin"]), editColorById);
router.delete("/:colorId", Auth, checkRole(["Owner", "Admin"]), deleteColorById);

module.exports = router;
