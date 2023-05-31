const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const joi = require("joi");
const mail = require("../../utils/email.utils");

const prisma = new PrismaClient();

const login = async (req, res) => {
  // #swagger.tags = ['Authentication']
  try {
    const { email, password } = req.body;

    const schema = joi.object().keys({
      email: joi.string().email().required(),
      password: joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      throw {
        status: 422,
        message: "Invalid request data",
        errors: error.details.map((detail) => {
          return {
            message: detail.message,
            path: detail.path,
          };
        }),
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw {
        status: 404,
        message: "Email not registered",
      };
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw {
        status: 401,
        message: "Incorrect password",
      };
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      {
        expiresIn: "30d",
      }
    );

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const refreshToken = async (req, res) => {
  // #swagger.tags = ['Authentication']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { refresh_token } = req.body;

    const schema = joi.object().keys({
      refresh_token: joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      throw {
        status: 422,
        message: "Invalid request data",
        errors: error.details.map((detail) => {
          return {
            message: detail.message,
            path: detail.path,
          };
        }),
      };
    }

    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        token: refresh_token,
      },
      include: {
        user: true,
      },
    });
    if (!refreshToken) {
      throw {
        status: 401,
        message: "Invalid refresh token",
      };
    }

    jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      (err, user) => {
        try {
          if (err) {
            throw {
              status: 401,
              message: "Invalid refresh token",
            };
          }

          return user;
        } catch (error) {
          throw {
            status: 401,
            message: "Invalid refresh token",
          };
        }
      }
    );

    const payload = {
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    return res.status(200).json({
      status: 200,
      message: "Refresh token successful",
      data: {
        access_token: accessToken,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const logout = async (req, res) => {
  // #swagger.tags = ['Authentication']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { refresh_token } = req.body;

    const schema = joi.object().keys({
      refresh_token: joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      throw {
        status: 422,
        message: "Invalid request data",
        errors: error.details.map((detail) => {
          return {
            message: detail.message,
            path: detail.path,
          };
        }),
      };
    }

    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        AND: [
          {
            token: refresh_token,
            user_id: req.user.id,
          },
        ],
      },
    });
    if (!refreshToken) {
      throw {
        status: 401,
        message: "Invalid refresh token",
      };
    }

    await prisma.refreshToken.delete({
      where: {
        id: refreshToken.id,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const requestResetPassword = async (req, res) => {
  // #swagger.tags = ['Authentication']

  try {
    const { email } = req.body;

    const schema = joi.object().keys({
      email: joi.string().email().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      throw {
        status: 422,
        message: "Invalid request data",
        errors: error.details.map((detail) => {
          return {
            message: detail.message,
            path: detail.path,
          };
        }),
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    const OTP = Math.floor(100000 + Math.random() * 900000);

    const salt = await bcrypt.genSalt(10);
    const resetToken = await bcrypt.hash(OTP.toString(), salt);

    await prisma.resetPassword.upsert({
      where: {
        user_id: user.id,
      },
      update: {
        token: resetToken,
        is_verified: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      },
      create: {
        user_id: user.id,
        token: resetToken,
        is_verified: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await mail.sendEmail({
      to: user.email,
      subject: "Reset Password",
      text: `Your OTP is ${OTP} and will expire in 5 minutes.`,
    });

    return res.status(200).json({
      status: 200,
      message: "Reset password request successful",
      data: null,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const verifyResetPassword = async (req, res) => {
  // #swagger.tags = ['Authentication']

  try {
    const { email, token } = req.body;

    const schema = joi.object().keys({
      email: joi.string().email().required(),
      token: joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      throw {
        status: 422,
        message: "Invalid request data",
        errors: error.details.map((detail) => {
          return {
            message: detail.message,
            path: detail.path,
          };
        }),
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    const resetPassword = await prisma.resetPassword.findFirst({
      where: {
        user_id: user.id,
      },
    });
    if (!resetPassword) {
      throw {
        status: 404,
        message: "Invalid token",
      };
    }

    const isMatch = await bcrypt.compare(token, resetPassword.token);
    if (!isMatch) {
      throw {
        status: 400,
        message: "Invalid token",
      };
    }

    if (resetPassword.is_verified) {
      throw {
        status: 400,
        message: "Token already verified",
      };
    }

    if (resetPassword.expires_at < new Date()) {
      throw {
        status: 400,
        message: "Token expired",
      };
    }

    await prisma.resetPassword.update({
      where: {
        id: resetPassword.id,
      },
      data: {
        is_verified: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Token verified",
      data: null,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const resetPassword = async (req, res) => {
  // #swagger.tags = ['Authentication']

  try {
    const { email, token, password, password_confirmation } = req.body;

    const schema = joi.object().keys({
      email: joi.string().email().required(),
      token: joi.string().required(),
      password: joi.string().min(6).required(),
      password_confirmation: joi.string().min(6).required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      throw {
        status: 422,
        message: "Invalid request data",
        errors: error.details.map((detail) => {
          return {
            message: detail.message,
            path: detail.path,
          };
        }),
      };
    }

    if (password !== password_confirmation) {
      throw {
        status: 422,
        message: "Password and password confirmation does not match",
      };
    }

    const resetPassword = await prisma.resetPassword.findFirst({
      where: {
        user: {
          email,
        },
      },
    });
    if (!resetPassword) {
      throw {
        status: 404,
        message: "Invalid token",
      };
    }

    if (!resetPassword.is_verified) {
      throw {
        status: 400,
        message: "Token not verified",
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.resetPassword.delete({
      where: {
        id: resetPassword.id,
      },
    });

    await mail.sendEmail({
      to: email,
      subject: "Password Reset",
      text: `Your password has been reset successfully.`,
    });

    return res.status(200).json({
      status: 200,
      message: "Password reset successful",
      data: null,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  requestResetPassword,
  verifyResetPassword,
  resetPassword,
};
