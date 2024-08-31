const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

const User = require("./user.routes");
const UserProfile = require("./userProfile.routes");
const Notification = require("./notification.routes");
const Category = require("./category.routes");
const Promotion = require("./promotion.routes");
const Product = require("./product.routes");
const Image = require("./image.routes");
const Size = require("./size.routes");
const Color = require("./color.routes");
const Cart = require("./cart.routes");
const Payment = require("./payment.routes");
const Review = require("./review.routes");
const Discussion = require("./discussion.routes");
const Reply = require("./reply.routes");

const swagger_path = path.resolve(__dirname, "../docs/swagger.yaml");
const customCssUrl = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
const customJs = ["https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js", "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"];
const file = fs.readFileSync(swagger_path, "utf8");

// API Docs
const swaggerDocument = YAML.parse(file);
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customCssUrl, customJs }));

// API
router.use("/api/v1/users", User);
router.use("/api/v1/user-profiles", UserProfile);
router.use("/api/v1/notifications", Notification);
router.use("/api/v1/categories", Category);
router.use("/api/v1/promotions", Promotion);
router.use("/api/v1/products", Product);
router.use("/api/v1/images", Image);
router.use("/api/v1/sizes", Size);
router.use("/api/v1/colors", Color);
router.use("/api/v1/carts", Cart);
router.use("/api/v1/payments", Payment);
router.use("/api/v1/reviews", Review);
router.use("/api/v1/discussions", Discussion);
router.use("/api/v1/replies", Reply);

module.exports = router;
