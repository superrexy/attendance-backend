const { PrismaClient } = require("@prisma/client");
const joi = require("joi");

const harvesineDistance = require("haversine-distance");
const prisma = new PrismaClient();

const getAttendances = async (req, res) => {
  // #swagger.tags = ['Attendances']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    let attendaces;
    if (req.user.role === "admin") {
      attendaces = await prisma.attendance.findMany({
        include: {
          user: {},
        },
      });
    } else {
      attendaces = await prisma.attendance.findMany({
        where: {
          user_id: req.user.id,
        },
        include: {
          user: {},
        },
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Successfully retrieved attendances",
      data: attendaces,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const getAttendanceById = async (req, res) => {
  // #swagger.tags = ['Attendances']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { attendanceId } = req.params;

    let attendance;

    if (req.user.role === "admin") {
      attendance = await prisma.attendance.findFirst({
        where: {
          AND: [
            {
              id: Number(attendanceId),
            },
          ],
        },
        include: {
          user: {},
        },
      });
    } else {
      attendance = await prisma.attendance.findFirst({
        where: {
          AND: [
            {
              id: Number(attendanceId),
              user_id: req.user.id,
            },
          ],
        },
        include: {
          user: {},
        },
      });
    }

    if (!attendance) {
      throw {
        status: 404,
        message: "Attendance not found",
      };
    }

    return res.status(200).json({
      status: 200,
      message: "Successfully retrieved attendance",
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const checkIn = async (req, res) => {
  // #swagger.tags = ['Attendances']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { label, latitude, longitude, status } = req.body;

    const checkAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: req.user.id,
        created_at: {
          gte: new Date().setHours(0, 0, 0, 0),
          lt: new Date().setHours(23, 59, 59, 999),
        },
      },
    });
    if (checkAttendance) {
      throw {
        status: 422,
        message: "You have already checked in today",
      };
    }

    console.log(new Date());

    const schema = joi.object().keys({
      label:
        status == "leave" ? joi.string().required() : joi.string().optional(),
      latitude: joi.number().required(),
      longitude: joi.number().required(),
      status: joi.string().valid("present", "absent", "leave").required(),
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

    const attendanceLocationOption =
      await prisma.attendanceLocation.findFirst();
    if (attendanceLocationOption.is_active) {
      const distance = harvesineDistance(
        {
          latitude: attendanceLocationOption.latitude,
          longitude: attendanceLocationOption.longitude,
        },
        {
          latitude,
          longitude,
        }
      );

      if (distance > attendanceLocationOption.radius) {
        throw {
          status: 422,
          message: `You can't check in outside of ${attendanceLocationOption.radius} meters from the office`,
        };
      }
    }

    const attendanceScheduleOption =
      await prisma.attendanceSchedule.findFirst();

    const openCheckIn = new Date(
      attendanceScheduleOption.start_time
    ).getHours();
    const closeCheckIn = new Date(attendanceScheduleOption.end_time).getHours();
    const currentTime = new Date().getHours();
    if (currentTime <= openCheckIn) {
      throw {
        status: 422,
        message: `You can't check in yet, before ${openCheckIn} AM`,
      };
    }

    if (currentTime >= closeCheckIn) {
      throw {
        status: 422,
        message: `You can't check in anymore, after ${closeCheckIn} AM`,
      };
    }

    const attendance = await prisma.attendance.create({
      data: {
        label,
        check_in_latitude: Number(latitude),
        check_in_longitude: Number(longitude),
        status: status.toUpperCase(),
        check_in: new Date(),
        user_id: req.user.id,
        file: req.file ? req.file.filename : null,
      },
    });

    return res.status(201).json({
      status: 201,
      message: "Successfully checked in",
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

const checkOut = async (req, res) => {
  // #swagger.tags = ['Attendances']
  /* #swagger.security = [{
               "AuthenticationJWT": []
        }] */
  try {
    const { latitude, longitude } = req.body;

    const schema = joi.object().keys({
      latitude: joi.number().required(),
      longitude: joi.number().required(),
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

    const attendance = await prisma.attendance.findFirst({
      where: {
        AND: [
          {
            user_id: req.user.id,
            created_at: {
              gte: new Date().setHours(0, 0, 0, 0),
              lt: new Date().setHours(23, 59, 59, 999),
            },
          },
        ],
      },
    });

    if (!attendance) {
      throw {
        status: 404,
        message: "You have not checked in today",
      };
    }

    if (attendance.check_out) {
      throw {
        status: 422,
        message: "You have already checked out today",
      };
    }

    const attendanceScheduleOption =
      await prisma.attendanceSchedule.findFirst();
    const openCheckOut = new Date(attendanceScheduleOption.end_time).getHours();
    const currentTime = new Date().getHours();

    if (currentTime <= openCheckOut) {
      throw {
        status: 422,
        message: `You can't check out yet, before ${openCheckOut} PM`,
      };
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out: new Date(),
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Successfully checked out",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Internal Server Error",
      errors: error.errors || undefined,
    });
  }
};

module.exports = {
  getAttendances,
  getAttendanceById,
  checkIn,
  checkOut,
};
