const swaggerAutogen = require("swagger-autogen")();
require("dotenv").config();

const doc = {
  info: {
    title: "Webcare Indonesia Attendance API",
    description: "API Documentation for Webcare Indonesia Attendance",
  },
  host: `localhost:${process.env.PORT}`,
  schemes: ["http"],
  securityDefinitions: {
    AuthenticationJWT: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
};

const outputFile = "./docs/swagger-output.json";
const endpointsFiles = ["./routes/index.js"];

/* NOTE: if you use the express Router, you must pass in the
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc);
