import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join a room for a course to listen for specific generation updates
    socket.on('join_course', (courseId) => {
      socket.join(`course_${courseId}`);
      console.log(`[Socket] Socket ${socket.id} joined course room: course_${courseId}`);
    });

    // Each user joins their own personal room for targeted notifications
    socket.on('join_user', (userId) => {
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
