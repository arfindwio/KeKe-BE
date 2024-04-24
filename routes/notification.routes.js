const router = require("express").Router();
const { getAllNotifications, createNotification, markNotificationsAsRead } = require("../controllers/notification.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.get("/", Auth, checkRole(["User", "Admin"]), getAllNotifications);
router.post("/", Auth, checkRole(["Admin"]), createNotification);
router.put("/markAsRead", Auth, checkRole(["User", "Admin"]), markNotificationsAsRead);

module.exports = router;
