export const publicRoutes = [
  '/',
  '/api/paystack/webhook',
  '/products',
  '/product/[id]',
  '/cart',
];

export const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/new-verification',
  '/auth/forgot-password',
  '/auth/new-password'
];

// Make /dashboard accessible to all authenticated users
export const commonAuthenticatedRoutes = [
  '/dashboard'
];

export const adminRoutes = [
   '/dashboard/orders',
  '/dashboard/orders/*',
  '/dashboard/categories',
  '/dashboard/categories/*',
  '/dashboard/products',
  '/dashboard/products/*',
  '/dashboard/delivery',
  '/dashboard/delivery/*',
  '/dashboard/profit',
  '/dashboard/profit/*',
  '/dashboard/revenue',
  '/dashboard/users',
  '/dashboard/payout',
  '/dashboard/userDetails',
  '/dashboard/referrals',
  '/dashboard/users/*',
  '/dashboard/new-arrivals',
  '/dashboard/new-arrivals/*',
  '/dashboard/settings',
  '/transaction/[id]',
];

export const userRoutes = [
  '/dashboard/orders',
  '/dashboard/orders/*',
  '/dashboard/settings',
  '/transaction/[id]',
];

export const customerRoutes = [
  '/dashboard/my-order',
  '/dashboard/my-order/*',
  '/dashboard/my-referral',
  '/dashboard/settings',
  '/transaction/[id]',
];

export const apiAuthPrefix = [
  '/api/auth',
  '/api/users/*',
  '/api/two-factor/*',
];

export const DEFAULT_LOGIN_REDIRECT = '/';