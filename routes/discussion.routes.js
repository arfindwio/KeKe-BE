const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllDiscussions, getDiscussionsByProductId, createDiscussion, deleteDiscussionById } = require("../controllers/discussion.controllers");

router.get("/", Auth, checkRole(["Owner", "Admin"]), getAllDiscussions);
router.get("/:productId", getDiscussionsByProductId);
router.post("/:productId", Auth, checkRole(["Owner", "Admin", "User"]), createDiscussion);
router.delete("/:discussionId", Auth, checkRole(["Owner", "Admin", "User"]), deleteDiscussionById);

module.exports = router;
