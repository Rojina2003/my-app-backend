const express = require('express');
const cors = require("cors");
const mongoose = require("mongoose");
const fs =require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
require("dotenv").config();


const app = express();
app.use(cors());
const port =  process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  // console.log('from server')
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded( {extended: true}));




//db conection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log("db conection successfull"))
.catch(err => console.error("db conection failed", err));


//routes
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");

app.use("/users", usersRouter);
app.use("/posts", postsRouter );

const Post = require("./models/post.model"); // Import Post model

// Function to fetch and insert initial data
const fetchAndPopulateData = async () => {
  try {
    const count = await Post.countDocuments();
    if (count === 0) {
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts?start=0&_limit=10');
      await Post.insertMany(response.data);
      console.log("Initial data populated");
    } else {
      console.log("Data already exists, skipping population");
    }
  } catch (error) {
    console.error("Error fetching and populating data", error);
  }
};

// Call fetchAndPopulateData function on server startup
fetchAndPopulateData();

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
