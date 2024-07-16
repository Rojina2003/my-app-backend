const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/user.model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//multer fo storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

router.get("/:id", auth,async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(400).json("user not found");
    res.json(user);
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

function validatePassword(password) {
  const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-+.]).{6,20}$/;
  return re.test(password);
}

const validateEmail = function (email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
const validateNumber = function (number) {
  const re = /^\d{10}$/;
  return re.test(number);
};

const validateName = function (name) {
  const re = /^[a-zA-Z]{3,20}$/;
  return re.test(name);
};

const validateLname = function (lname) {
  const re = /^[a-zA-Z]{3,20}$/;
  return re.test(lname);
};
// Register a new user
router.post("/register", upload.single("image"), async (req, res) => {
  const { email, name, lname, number, password } = req.body;
  const image = req.file ? req.file.filename : null;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    // Validate username
    if (!validateName(name)) {
      return res.status(400).json({ msg: "Invalid name" });
    }

    if (!validateLname(lname)) {
      return res.status(400).json({ msg: "Invalid lname" });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    // Validate phone number
    if (!validateNumber(number)) {
      return res.status(400).json({ msg: "Invalid phone number" });
    }

    const newUser = new User({ email, name, lname, number, password, image });

    const salt = await bcrypt.genSalt(12);
    newUser.password = await bcrypt.hash(password, salt);

    const existNumber = await User.findOne({ number });
    if (existNumber) {
      return res.status(400).json({ msg: "Phone number already exists" });
    }

    await newUser.save();
    res.json({ msg: "User registered successfully" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Update a registered user
router.put("/edit/:id", auth, upload.single("image"), async (req, res) => {
  const { email, name,lname, number, password } = req.body;
  const image = req.file ? req.file.filename : null;

 

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    if (name && !validateName(name)) {
      return res.status(400).json({ msg: "Invalid name" });
    }

    if (lname && !validateName(lname)) {
      return res.status(400).json({ msg: "Invalid lname" });
    }

    if (password && !validatePassword(password)) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    if (number && !validateNumber(number)) {
      return res.status(400).json({ msg: "Invalid phone number" });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists.id !== req.params.id) {
        return res.status(400).json({ msg: "Email already exists" });
      }
    }

    if (number) {
      const numberExists = await User.findOne({ number });
      if (numberExists && numberExists.id !== req.params.id) {
        return res.status(400).json({ msg: "Phone number already exists" });
      }
    }

    if (email) user.email = email;
    if (name) user.name = name;
    if (lname) user.lname = lname;
    if (number) user.number = number;
    if (image) user.image = image;

    if (password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ msg: "User updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid Email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const payload = { user: { id: user.id, name: user.name } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Get authenticated user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

//logout
router.post("/logout", (req, res) => {
  res.json({ msg: "User logged out" });
});

router.route("/uploads/:id").get((req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      // console.log(user);
      if (!user || !user.image) {
        
        return res.status(404).send('Image not found');
      }
      const imagePath = path.join(__dirname, '../uploads',user.image);
      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
          return res.status(404).send('Image not found');
        }
        res.sendFile(imagePath);
      });
    })
    .catch((err) => res.status(400).json("Error: " + err));
});


module.exports = router;
