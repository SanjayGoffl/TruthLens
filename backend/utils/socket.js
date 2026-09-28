const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
let ioInstance = null;
function initSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: { origin: env.frontendUrl, methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling']
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, env.jwtSecret, { issuer: 'newsguard-ai' });
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return next(new Error('unauthorized'));
      socket.userId = String(user._id);
      socket.userRole = user.role;
      return next();
    } catch (err) {
      return next(new Error('unauthorized'));
    }
  });
  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === 'ADMIN') socket.join('admins');
  });
  ioInstance = io;
  return io;
}
function getIo() {
  return ioInstance;
}
function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}
function emitToAdmins(event, payload) {
  if (!ioInstance) return;
  ioInstance.to('admins').emit(event, payload);
}
module.exports = { initSocket, getIo, emitToUser, emitToAdmins };
