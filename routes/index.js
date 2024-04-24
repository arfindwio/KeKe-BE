const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("../docs/swagger.json");
const User = require("./user.routes");
const UserProfile = require("./userProfile.routes");
const Notification = require("./notification.routes");
const Category = require("./category.routes");
const Product = require("./product.routes");
const Size = require("./size.routes");
const Color = require("./color.routes");

// API Docs
router.use("/api-docs", swaggerUi.serve);
router.get("/api-docs", swaggerUi.setup(swaggerDocument));

// API
router.use("/api/v1/users", User);
router.use("/api/v1/user-profiles", UserProfile);
router.use("/api/v1/notifications", Notification);
router.use("/api/v1/categories", Category);
router.use("/api/v1/products", Product);
router.use("/api/v1/sizes", Size);
router.use("/api/v1/colors", Color);

module.exports = router;
