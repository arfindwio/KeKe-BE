const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { createCategory, getAllCategories, editCategoryById, deleteCategoryById } = require("../controllers/category.controllers");

router.get("/", getAllCategories);
router.post("/", Auth, checkRole(["Admin"]), createCategory);
router.put("/:categoryId", Auth, checkRole(["Admin"]), editCategoryById);
router.delete("/:categoryId", Auth, checkRole(["Admin"]), deleteCategoryById);

module.exports = router;
