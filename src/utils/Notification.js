// import { verifyAdminSocket } from '../middlewares/';
import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';

const { log } = console;

export const verifyAdminSocket = (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    try {
      const decodedToken = jwt.verify(
        socket.handshake.query.token,
        process.env.JWT_SECRET
      );
      if (decodedToken.role !== 'admin')
        return next(new Error('Authentication error'));
      socket.decoded = decodedToken;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
};

export default class Notification {
  constructor(app) {
    this.io = socketIo(app);
    this.socket = null;
    this.username = null;
  }
  start() {
    // log('Notification class started');
    this.io.use(verifyAdminSocket).on('connection', (socket) => {
      log(
        `${socket.decoded.username} connected to cybersource socket successfully`
      );
      this.username = socket.decoded.username;
      this.socket = socket;
    });
    this.io.on('disconnect', () => {
      log('user disconnected');
    });
  }
  trigger(id, message) {
    if (!this.socket || !this.username) {
      log('Socket not connected. Please start socket connection');
    } else {
      this.socket.emit(`${this.username}-${id}`, message);
    }
  }
}
