const router = require("express").Router();
const { register, login, verifyOtp, resendOtp, forgetPasswordUser, updatePasswordUser, authenticateUser, changePasswordUser, googleOauth2, getAllUsers, deleteUserById, ChangeRoleUserById } = require("../controllers/user.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const passport = require("../libs/passport");

router.post("/register", register);
router.post("/login", login);
router.put("/verify-otp", verifyOtp);
router.put("/resend-otp", resendOtp);
router.post("/forget-password", forgetPasswordUser);
router.put("/update-password", updatePasswordUser);
router.get("/authenticate", Auth, checkRole(["Owner", "Admin", "User"]), authenticateUser);
router.put("/change-password", Auth, checkRole(["Owner", "Admin", "User"]), changePasswordUser);
router.get("/", Auth, checkRole(["Owner", "Admin"]), getAllUsers);
router.delete("/:id", Auth, checkRole(["Owner", "Admin"]), deleteUserById);
router.put("/role/:id", Auth, checkRole(["Owner", "Admin"]), ChangeRoleUserById);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/v1/users/google",
    session: false,
  }),
  googleOauth2
);

module.exports = router;
