const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllSizes, createSize, getSizesByProductId, editSizeById, deleteSizeById } = require("../controllers/size.controllers");

router.get("/", Auth, checkRole(["Owner", "Admin"]), getAllSizes);
router.post("/", Auth, checkRole(["Owner", "Admin"]), createSize);
router.get("/:productId", getSizesByProductId);
router.put("/:sizeId", Auth, checkRole(["Owner", "Admin"]), editSizeById);
router.delete("/:sizeId", Auth, checkRole(["Owner", "Admin"]), deleteSizeById);

module.exports = router;
