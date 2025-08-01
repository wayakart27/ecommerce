export const publicRoutes = [
  '/',
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
  '/dashboard/users',
  '/dashboard/users/*',
  '/dashboard/new-arrivals',
  '/dashboard/new-arrivals/*',
  '/dashboard/settings',
];

export const userRoutes = [
  '/dashboard/orders',
  '/dashboard/orders/*',
  '/dashboard/settings',
];

export const customerRoutes = [
  '/dashboard/my-order',
  '/dashboard/my-order/*',
  '/dashboard/settings',
];

export const apiAuthPrefix = [
  '/api/auth',
  '/api/paystack/*',
  '/api/users/*',
  '/api/two-factor/*',
];

export const DEFAULT_LOGIN_REDIRECT = '/';