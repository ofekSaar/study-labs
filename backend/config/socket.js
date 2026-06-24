import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  // Authenticate socket connections via JWT in handshake auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('_id roles role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join course room — user must be enrolled or be the instructor
    socket.on('join_course', async (courseId) => {
      try {
        const enrollment = await Enrollment.findOne({
          course: courseId,
          student: socket.user._id,
          status: 'approved',
        });
        const Course = (await import('../models/Course.js')).default;
        const course = await Course.findById(courseId).select('instructor');
        const isInstructor = course && course.instructor.toString() === socket.user._id.toString();

        if (!enrollment && !isInstructor) {
          socket.emit('error', 'Not authorized for this course');
          return;
        }
        socket.join(`course_${courseId}`);
        console.log(`[Socket] Socket ${socket.id} joined course room: course_${courseId}`);
      } catch {
        socket.emit('error', 'Failed to join course room');
      }
    });

    // Users may only join their own personal room
    socket.on('join_user', (userId) => {
      if (userId !== socket.user._id.toString()) {
        socket.emit('error', 'Not authorized to join this room');
        return;
      }
      socket.join(`user_${userId}`);
      console.log(`[Socket] Socket ${socket.id} joined user room: user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
