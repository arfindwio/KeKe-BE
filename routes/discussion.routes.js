const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllDiscussions, getDiscussionsByProductId, createDiscussion, deleteDiscussionById } = require("../controllers/discussion.controllers");

router.get("/", Auth, checkRole(["Admin"]), getAllDiscussions);
router.get("/:productId", getDiscussionsByProductId);
router.post("/:productId", Auth, checkRole(["User", "Admin"]), createDiscussion);
router.delete("/:discussionId", Auth, checkRole(["User", "Admin"]), deleteDiscussionById);

module.exports = router;
