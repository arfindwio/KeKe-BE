const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { createDiscussion, deleteDiscussionById } = require("../controllers/discussion.controllers");

router.post("/:productId", Auth, checkRole(["User", "Admin"]), createDiscussion);
router.delete("/:discussionId", Auth, checkRole(["User", "Admin"]), deleteDiscussionById);

module.exports = router;
