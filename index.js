// Requires "axios" and "form-data" to be installed (see https://www.npmjs.com/package/axios and https://www.npmjs.com/package/form-data)
const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

// app configuration
const config = {
  port: 5000,
};

if (!fs.existsSync(path.join(__dirname, "images"))) {
  fs.mkdirSync(path.join(__dirname, "images"));
}
if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"));
}

app.use(cors());
app.use("/images", express.static("/images"));

let inputPath = path.join(__dirname, `/path/to/file.jpg`);
let imageFileName = null;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    imageFileName = file.originalname;
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
app.post(
  "/photo",
  upload.single("photo"),
  function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    // console.log(req.files);
    next();
  },
  (req, res, next) => {
    inputPath = path.join(__dirname, "uploads", imageFileName);
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append(
      "image_file",
      fs.createReadStream(inputPath),
      path.basename(inputPath)
    );
    axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": "zRwFcQsAAbQP9z2c67Nr9uon",
      },
      encoding: null,
    })
      .then(async (response) => {
        if (response.status != 200)
          return console.error("Error:", response.status, response.statusText);
        await fsPromises.writeFile(
          path.join(__dirname, "images", imageFileName.split(".")[0] + ".png"),
          response.data
        );

        app.get("/images/:imageName", async (req, res) => {
          try {
            if (req.params.imageName.includes(".png")) {
              const data = await fsPromises.readFile(
                path.join("images", req.params.imageName)
              );
              //   res.writeHead(200, { "content-type": "image/png" });
              res.send(data);
            }
            if (req.params.imageName.includes(".jpg")) {
              const data = await fsPromises.readFile(
                path.join("uploads", req.params.imageName)
              );
              //   res.writeHead(200, { "content-type": "image/jpeg" });
              res.send(data);
            }
          } catch (err) {
            console.log(err.message);
          }
        });
        next();
      })
      .catch((error) => {
        return console.error("Request failed:", error);
      });
  },
  (req, res) => {
    res.status(200);
    res.send("Image Uploaded SuccessFully");
  }
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(config.port, () => {
  console.log("server is running on port: ", config.port);
});
