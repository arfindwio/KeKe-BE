const router = require("express").Router();
const { getAllNotifications, createNotification, markNotificationsAsRead } = require("../controllers/notification.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.get("/", Auth, checkRole(["Owner", "Admin", "User"]), getAllNotifications);
router.post("/", Auth, checkRole(["Owner", "Admin"]), createNotification);
router.put("/markAsRead", Auth, checkRole(["Owner", "Admin", "User"]), markNotificationsAsRead);

module.exports = router;
