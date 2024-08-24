const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { image } = require("../libs/multer");
const { createImage, editImageById, deleteImageById } = require("../controllers/image.controllers");

router.post("/", Auth, checkRole(["Owner", "Admin"]), image.single("image"), createImage);
router.put("/:imageId", Auth, checkRole(["Owner", "Admin"]), image.single("image"), editImageById);
router.delete("/:imageId", Auth, checkRole(["Owner", "Admin"]), deleteImageById);

module.exports = router;
