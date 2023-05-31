const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const joi = require("joi");

const prisma = new PrismaClient();

const getUsers = async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Successfully retrieved users",
      data: users,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const getUserById = async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    return res.status(200).json({
      status: 200,
      message: "Successfully retrieved user",
      data: user,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const createUser = async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { name, email, password, role } = req.body;

    const schema = joi.object().keys({
      name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().min(8).required(),
      role: joi.string().valid("user", "admin").required(),
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
    if (user) {
      throw {
        status: 409,
        message: "Email already registered",
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
      },
    });

    return res.status(201).json({
      status: 201,
      message: "Successfully created user",
      data: newUser,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const updateUser = async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { userId } = req.params;
    const { name, email, password, role } = req.body;

    const schema = joi.object().keys({
      name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().min(8).optional(),
      role: joi.string().valid("user", "admin").required(),
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
        id: Number(userId),
      },
    });
    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    if (email) {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (user) {
        throw {
          status: 409,
          message: "Email already registered",
        };
      }
    }

    let newUser;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      newUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: name,
          email: email,
          password: hashedPassword,
          role: role,
        },
      });
    } else {
      newUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: name,
          email: email,
          role: role,
        },
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Successfully update user",
      data: newUser,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const deleteUser = async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });
    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    await prisma.user.delete({
      where: {
        id: Number(userId),
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Successfully deleted user",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const profile = async (req, res) => {
  // #swagger.tags = ['User / Profile']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Successfully retrieved user profile",
      data: user,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const updateProfile = async (req, res) => {
  /*
    #swagger.tags = ['User / Profile']
    #swagger.autoBody=false
    #swagger.security = [{
                "AuthenticationJWT": []
        }]
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['name'] = {
        in: 'formData',
        type: 'string',
        required: true,
        description: 'Name'
    }
    #swagger.parameters['avatar'] = {
        in: 'formData',
        type: 'file',
        required: false,
        description: 'Avatar'
    }
        */

  try {
    console.log(req);

    const { name } = req.body;

    const schema = joi.object().keys({
      name: joi.string().required(),
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
        id: req.user.id,
      },
    });
    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    const newUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: name,
        avatar: req.file ? req.file.path : undefined,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Successfully update user",
      data: newUser,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const changePassword = async (req, res) => {
  /*
    #swagger.tags = ['User / Profile']
     // #swagger.tags = ['User / Profile']
    #swagger.security = [{
               "AuthenticationJWT": []
        }]
  */

  try {
    const { old_password, new_password, new_password_confirmation } = req.body;

    const schema = joi.object().keys({
      old_password: joi.string().required(),
      new_password: joi.string().min(6).required(),
      new_password_confirmation: joi.string().min(6).required(),
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
        id: req.user.id,
      },
    });

    if (!user) {
      throw {
        status: 404,
        message: "User not found",
      };
    }

    const isPasswordMatch = await bcrypt.compare(old_password, user.password);
    if (!isPasswordMatch) {
      throw {
        status: 422,
        message: "Old password is incorrect",
      };
    }

    if (new_password !== new_password_confirmation) {
      throw {
        status: 422,
        message: "New password confirmation does not match",
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Successfully change password",
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
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  profile,
  updateProfile,
  changePassword,
};
