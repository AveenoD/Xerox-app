import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import orderService from '../services/order.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { FILE_CONFIG } from '../config/constants.js';

// Create order
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { vendorId, pageCount, printConfig, customerNotes } = req.body;
  const file = req.file;

  if (!file) {
    throw ApiError.badRequest('File is required');
  }

  // Upload to Cloudinary (simplified - actual implementation would use cloudinary SDK)
  const fileUrl = `/uploads/${file.filename}`;
  const previewUrl = `/uploads/preview_${file.filename}`; // Would be watermarked preview

  const order = await orderService.createOrder(
    req.user._id,
    vendorId,
    file.originalname,
    fileUrl,
    previewUrl,
    parseInt(pageCount),
    file.size,
    printConfig,
    customerNotes
  );

  new ApiResponse(201, order, 'Order created successfully').send(res);
});

// Accept order (vendor)
export const acceptOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;

  const order = await orderService.acceptOrder(orderId, req.user._id);

  new ApiResponse(200, order, 'Order accepted').send(res);
});

// Reject order (vendor)
export const rejectOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await orderService.rejectOrder(orderId, req.user._id, reason);

  new ApiResponse(200, order, 'Order rejected').send(res);
});

// Mark printing (vendor)
export const markPrinting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;

  const order = await orderService.markPrinting(orderId, req.user._id);

  new ApiResponse(200, order, 'Order marked as printing').send(res);
});

// Mark ready (vendor)
export const markReady = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;

  const order = await orderService.markReady(orderId, req.user._id);

  new ApiResponse(200, order, 'Order ready for pickup').send(res);
});

// Complete order (customer)
export const completeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;

  const order = await orderService.completeOrder(orderId, req.user._id);

  new ApiResponse(200, order, 'Order completed').send(res);
});

// Cancel order (customer)
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;

  const order = await orderService.cancelOrder(orderId, req.user._id);

  new ApiResponse(200, order, 'Order cancelled').send(res);
});

// Get order by ID
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId);

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  new ApiResponse(200, order, 'Order fetched').send(res);
});

// Get my orders (customer)
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { status, page = '1', limit = '10' } = req.query;

  const result = await orderService.getCustomerOrders(req.user._id, {
    status: status as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });

  new ApiResponse(200, result.orders, 'Orders fetched', {
    page: result.page,
    limit: parseInt(limit as string),
    total: result.total,
    totalPages: result.totalPages,
  }).send(res);
});

// Get vendor orders
export const getVendorOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { status, page = '1', limit = '10' } = req.query;

  // Get vendor profile for this user
  const vendorProfile = await (await import('../models/vendorProfile.model.js')).default.findOne({
    userId: req.user._id,
  });

  if (!vendorProfile) {
    throw ApiError.notFound('Vendor profile not found');
  }

  const result = await orderService.getVendorOrders(vendorProfile._id.toString(), {
    status: status as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });

  new ApiResponse(200, result.orders, 'Orders fetched', {
    page: result.page,
    limit: parseInt(limit as string),
    total: result.total,
    totalPages: result.totalPages,
  }).send(res);
});

// Toggle keep for future
export const toggleKeepForFuture = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { orderId } = req.params;
  const { keep } = req.body;

  const order = await orderService.toggleKeepForFuture(orderId, req.user._id, keep);

  new ApiResponse(200, order, keep ? 'File will be kept for 7 days' : 'File will be deleted after 24 hours').send(res);
});
