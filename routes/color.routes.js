const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllColors, createColor, getColorsByProductId, editColorById, deleteColor } = require("../controllers/color.controllers");

router.get("/", Auth, checkRole(["Admin"]), getAllColors);
router.post("/", Auth, checkRole(["Admin"]), createColor);
router.get("/:productId", getColorsByProductId);
router.put("/:colorId", Auth, checkRole(["Admin"]), editColorById);
router.delete("/:colorId", Auth, checkRole(["Admin"]), deleteColor);

module.exports = router;
