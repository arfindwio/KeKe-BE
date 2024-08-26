const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { createReply, deleteReplyById } = require("../controllers/reply.controllers");

router.post("/:discussionId", Auth, checkRole(["Owner", "Admin", "User"]), createReply);
router.delete("/:replyId", Auth, checkRole(["Owner", "Admin", "User"]), deleteReplyById);

module.exports = router;
