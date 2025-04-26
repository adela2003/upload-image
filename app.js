import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;

// 🗂️ system path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "data", "images.json");

// 📁 setting for save photo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
// Save image information
function saveImageData(data) {
  let images = [];
  if (fs.existsSync(dataFile)) {
    images = JSON.parse(fs.readFileSync(dataFile));
  }
  images.push(data);
  fs.writeFileSync(dataFile, JSON.stringify(images, null, 2));
}

//Read All images
function getAllImages() {
  if (fs.existsSync(dataFile)) {
    return JSON.parse(fs.readFileSync(dataFile));
  }
  return [];
}

// 🔧 setting of EJS and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// 📄 show upload form
app.get("/upload", (req, res) => {
  res.render("upload");
});

// Make gallery
app.get("/gallery", (req, res) => {
  const images = getAllImages();
  res.render("gallery", { images });
});

// 📤 send and show photo in home page
let uploadedImage = null;

app.post("/upload", upload.array("images", 10), (req, res) => {
  if (req.files) {
    req.files.forEach((file) => {
      const imageData = {
        filename: file.filename,
        originalname: file.originalname,
        uploadDate: new Date().toISOString(),
      };
      saveImageData(imageData);
    });
    res.redirect("/gallery");
  } else {
    res.send("No files uploaded.");
  }
});

app.post("/delete", (req, res) => {
  const filename = req.body.filename;

  //Remove file from form
  const filePath = path.join(__dirname, "public/uploads", filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting file:", err);
  });

  //Remove information from json
  let images = getAllImages();
  images = images.filter((img) => img.filename !== filename);
  fs.writeFileSync(dataFile, JSON.stringify(images, null, 2));

  res.redirect("/gallery");
});

// 🏠 home page
app.get("/", (req, res) => {
  res.render("home");
});

// ▶️ running server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
