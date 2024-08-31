const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllPayments, getPaymentsHistory, createPaymentMidtrans, editPaymentById, postPaymentNotification, getStatusMidtrans } = require("../controllers/payment.controllers");

router.get("/", Auth, checkRole(["Owner", "Admin"]), getAllPayments);
router.post("/", Auth, checkRole(["Owner", "Admin", "User"]), createPaymentMidtrans);
router.put("/:paymentId", Auth, checkRole(["Owner", "Admin"]), editPaymentById);
router.get("/history", Auth, checkRole(["Owner", "Admin", "User"]), getPaymentsHistory);
router.post("/payment-notification", postPaymentNotification);
router.get("/history/:orderId", Auth, checkRole(["Owner", "Admin", "User"]), getStatusMidtrans);

module.exports = router;
