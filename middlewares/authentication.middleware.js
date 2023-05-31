const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw {
        status: 401,
        message: "Unauthorized",
      };
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      throw {
        status: 401,
        message: "Unauthorized",
      };
    }

    const payload = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET,
      (err, payload) => {
        if (err) {
          throw {
            status: 401,
            message: "Unauthorized",
          };
        }

        return payload;
      }
    );

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw {
        status: 401,
        message: "Unauthorized",
      };
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};
