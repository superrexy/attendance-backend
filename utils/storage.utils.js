const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./public/uploads");
  },
  filename: function (req, file, callback) {
    console.log(file);

    const date = new Date().toJSON().slice(0, 10);
    const unieqPrefix = date + "_" + Math.round(Math.random() * 1e9);
    callback(
      null,
      unieqPrefix + "_" + file.fieldname + "_" + file.originalname
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    console.log(file);

    var mime = file.mimetype;
    if (mime !== "image/png" && mime !== "image/jpg" && mime !== "image/jpeg") {
      req.fileValidationError = "Only images are allowed";
      return callback(new Error("Only images are allowed", false));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = { upload, multer };
