const router = require("express").Router();
let Post = require("../models/post.model");
let auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");

//find all
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const posts = await Post.find()
      .populate("createdBy", "name")
      .skip((page - 1) * limit)
      .limit(limit);

    const totalItems = await Post.countDocuments();

    res.json({
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data: posts,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

//find by id
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    res.json(post);
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

// add post
router.route("/add").post(auth, async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ msg: "Title and body are required" });
  }

  try {
    const token = req.header("x-auth-token");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;

    const newPost = new Post({
      title,
      body,
      createdBy: userId, // Reference the User model using userId
    });

    await newPost.save();
    res.json("Post added!");
  } catch (error) {
    res.status(400).json("error:" + error);
  }
});

//update by id

router.put("/update/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    if (post.createdBy.toString() !== req.user.id) {
      // console.log(post.createdBy);
      // console.log(req.user.id);
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Update post fields
    post.title = req.body.title;
    post.body = req.body.body;

    await post.save();
    res.json("Post updated");
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

// Delete post by id
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    if (post.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await post.deleteOne({ _id: req.params.id }); // Use remove() method on the document
    res.json("Post Deleted");
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

//delete all

router.delete("/", auth, async (req, res) => {
  try {
    const { postIds } = req.body;
    await Post.deleteMany({ _id: { $in: postIds } });
    res.json("Selected posts deleted");
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

module.exports = router;
