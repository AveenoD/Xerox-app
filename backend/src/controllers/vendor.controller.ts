import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import vendorService from '../services/vendor.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Register as vendor
export const registerVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { shopName, shopAddress, coordinates, pricing, shopPhoto } = req.body;

  const vendor = await vendorService.registerVendor(
    req.user._id,
    shopName,
    shopAddress,
    coordinates,
    pricing,
    shopPhoto
  );

  new ApiResponse(201, vendor, 'Vendor registered successfully').send(res);
});

// Get my vendor profile
export const getMyVendorProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const vendor = await vendorService.getVendorByUserId(req.user._id);

  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  new ApiResponse(200, vendor, 'Vendor profile fetched').send(res);
});

// Get vendor by ID (public)
export const getVendorById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vendorId } = req.params;

  const vendor = await vendorService.getVendorById(vendorId);

  if (!vendor) {
    throw ApiError.notFound('Vendor not found');
  }

  new ApiResponse(200, vendor, 'Vendor fetched').send(res);
});

// Update vendor profile
export const updateVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const vendor = await vendorService.getVendorByUserId(req.user._id);

  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  const updatedVendor = await vendorService.updateVendor(vendor._id.toString(), req.body);

  new ApiResponse(200, updatedVendor, 'Vendor updated').send(res);
});

// Toggle shop status
export const toggleShopStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const vendor = await vendorService.getVendorByUserId(req.user._id);

  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  const updatedVendor = await vendorService.toggleShopStatus(vendor._id.toString());

  new ApiResponse(200, updatedVendor, updatedVendor.isOpen ? 'Shop is now open' : 'Shop is now closed').send(res);
});

// Search nearby vendors
export const searchNearbyVendors = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { longitude, latitude, maxDistance, minRating, page = '1', limit = '10' } = req.query;

  if (!longitude || !latitude) {
    throw ApiError.badRequest('Longitude and latitude are required');
  }

  const result = await vendorService.searchNearbyVendors(
    parseFloat(longitude as string),
    parseFloat(latitude as string),
    parseInt(maxDistance as string) || 5000,
    {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      minRating: minRating ? parseFloat(minRating as string) : undefined,
    }
  );

  new ApiResponse(200, result.vendors, 'Vendors fetched', {
    page: result.page,
    limit: parseInt(limit as string),
    total: result.total,
    totalPages: result.totalPages,
  }).send(res);
});

// Get vendor analytics
export const getVendorAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const vendor = await vendorService.getVendorByUserId(req.user._id);

  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  const analytics = await vendorService.getVendorAnalytics(vendor._id.toString());

  new ApiResponse(200, analytics, 'Analytics fetched').send(res);
});

// Calculate print cost
export const calculatePrintCost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vendorId, paperSize, printType, pageCount, copies = '1' } = req.query;

  if (!vendorId || !paperSize || !printType || !pageCount) {
    throw ApiError.badRequest('vendorId, paperSize, printType, and pageCount are required');
  }

  const cost = await vendorService.calculatePrintCost(
    vendorId as string,
    paperSize as string,
    printType as string,
    parseInt(pageCount as string),
    parseInt(copies as string)
  );

  new ApiResponse(200, { cost }, 'Cost calculated').send(res);
});
