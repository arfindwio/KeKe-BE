const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllPayments, getPaymentsHistory, createPaymentMidtrans, editPaymentById, postPaymentNotification } = require("../controllers/payment.controllers");

router.get("/", Auth, checkRole(["Admin"]), getAllPayments);
router.post("/", Auth, checkRole(["User", "Admin"]), createPaymentMidtrans);
router.put("/:paymentId", Auth, checkRole(["Admin"]), editPaymentById);
router.get("/history", Auth, checkRole(["User", "Admin"]), getPaymentsHistory);
router.post("/payment-notification", postPaymentNotification);

module.exports = router;
