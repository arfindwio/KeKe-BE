const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { createReply, deleteReplyById } = require("../controllers/reply.controllers");

router.post("/:discussionId", Auth, checkRole(["User", "Admin"]), createReply);
router.delete("/:replyId", Auth, checkRole(["User", "Admin"]), deleteReplyById);

module.exports = router;
