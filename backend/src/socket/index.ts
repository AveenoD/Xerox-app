import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

interface VendorSocket extends Socket {
  userId?: string;
  vendorId?: string;
}

interface CustomerSocket extends Socket {
  userId?: string;
}

// Extend global
declare global {
  var io: Server | undefined;
}

export const initializeSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: VendorSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, JWT_CONFIG.ACCESS_TOKEN_SECRET) as {
        _id: string;
        email: string;
        role: string;
      };
      socket.userId = decoded._id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Vendor namespace
  const vendorNamespace = io.of('/vendor');

  vendorNamespace.on('connection', (socket: VendorSocket) => {
    logger.info(`[Socket] Vendor connected: ${socket.userId}`);

    // Register vendor
    socket.on('register_vendor', async (vendorId: string) => {
      socket.vendorId = vendorId;
      socket.join(`vendor:${vendorId}`);
      logger.info(`[Socket] Vendor ${vendorId} registered`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`[Socket] Vendor disconnected: ${socket.userId}`);
    });
  });

  // Customer namespace
  const customerNamespace = io.of('/customer');

  customerNamespace.on('connection', (socket: CustomerSocket) => {
    logger.info(`[Socket] Customer connected: ${socket.userId}`);

    // Join order room for live updates
    socket.on('join_order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.info(`[Socket] Customer ${socket.userId} joined order: ${orderId}`);
    });

    // Leave order room
    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`[Socket] Customer disconnected: ${socket.userId}`);
    });
  });

  // Store io globally
  global.io = io;

  logger.info('[Socket] Socket.io initialized');

  return io;
};

// Helper to emit to vendor
export const emitToVendor = (vendorId: string, event: string, data: unknown): void => {
  if (global.io) {
    global.io.of('/vendor').to(`vendor:${vendorId}`).emit(event, data);
  }
};

// Helper to emit to order room (customer)
export const emitToOrderRoom = (orderId: string, event: string, data: unknown): void => {
  if (global.io) {
    global.io.of('/customer').to(`order:${orderId}`).emit(event, data);
  }
};

// Event types
export const SOCKET_EVENTS = {
  // Vendor events
  VENDOR_NEW_ORDER: 'order:new',
  VENDOR_ORDER_CANCELLED: 'order:cancelled',
  VENDOR_SLA_TICK: 'order:sla_tick',
  VENDOR_SLA_EXPIRED: 'order:sla_expired',

  // Customer events
  CUSTOMER_ORDER_ACCEPTED: 'order:accepted',
  CUSTOMER_ORDER_PRINTING: 'order:printing',
  CUSTOMER_ORDER_READY: 'order:ready',
  CUSTOMER_ORDER_COMPLETED: 'order:completed',
  CUSTOMER_ORDER_UPDATE: 'order:update',
  CUSTOMER_ORDER_CANCELLED: 'order:cancelled',
} as const;

export default { initializeSocket, emitToVendor, emitToOrderRoom, SOCKET_EVENTS };