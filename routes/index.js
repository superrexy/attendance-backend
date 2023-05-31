const express = require("express");
const swagger = require("swagger-ui-express");
const swaggerFile = require("../docs/swagger-output.json");

const authenticationRouter = require("../api/authentication/authentication.route");
const usersRouter = require("../api/users/users.route");
const attendancesRouter = require("../api/attendances/attendances.route");

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Authentication Routes
router.use("/api/authentication", authenticationRouter);

// Users Routes
router.use("/api/users", usersRouter);

// Attendances Routes
router.use("/api/attendances", attendancesRouter);

// Swagger Documentation Routes
router.use(
  "/api/docs",
  swagger.serve,
  swagger.setup(swaggerFile, {
    swaggerOptions: {
      showRequestDuration: true,
    },
  })
);

router.get("/api/docs-json", (req, res) => {
  return res.json(swaggerFile);
});

module.exports = router;
