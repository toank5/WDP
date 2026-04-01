// Environment configuration

// API Configuration
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://wdp-be-prod-2.up.railway.app'

// App Configuration
export const APP_CONFIG = {
  name: process.env.APP_NAME || 'EYEWEAR',
  version: process.env.APP_VERSION || '1.0.0',
  currency: process.env.APP_CURRENCY || 'VND',
  locale: process.env.APP_LOCALE || 'en-US',
}

// Development mode check
export const IS_DEV = process.env.__DEV__ === 'true' || __DEV__ === true

// Cloudinary Configuration (optional)
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: 'default_preset',
}

// Firebase Configuration (optional)
export const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
}

// Log environment in development mode
if (IS_DEV) {
  console.log('Environment Configuration:')
  console.log('API_BASE_URL:', API_BASE_URL)
  console.log('APP_CONFIG:', APP_CONFIG)
  console.log('Development Mode:', IS_DEV)
}
