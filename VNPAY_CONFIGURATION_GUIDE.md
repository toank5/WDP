# VNPay Configuration Guide

## Problem
The error "Website này chưa được phê duyệt" (This website has not been approved) occurs because VNPay requires you to whitelist return URLs in your merchant portal.

## Solution

### 1. Whitelist URLs in VNPay Merchant Portal

Login to VNPay Merchant Portal: https://sandbox.vnpayment.vn/merchantv2/

Navigate to: **Cấu hình** (Configuration) → **Cấu hình URL** (URL Configuration)

Add these URLs to the whitelist:
- **Return URL**: `http://localhost:5173/checkout/vnpay-return`
- **IPN URL**: `http://localhost:3000/checkout/vnpay-ipn`

**Important**: For production, replace with your actual domain URLs.

### 2. Restart Backend Server

The backend needs to be restarted to load the new environment variables:

```bash
# Stop current server
cd D:\Code\Project\WDP\wdp-be
# Press Ctrl+C if running in terminal

# Start again
npm run start:dev
```

### 3. Environment Variables Added

The following variables were added to `wdp-be/.env`:

```env
VNPAY_RETURN_URL=http://localhost:5173/checkout/vnpay-return
VNPAY_IPN_URL=http://localhost:3000/checkout/vnpay-ipn
```

### 4. Testing the Payment Flow

1. Add items to cart
2. Go to checkout: `http://localhost:5173/checkout`
3. Fill in shipping address
4. Click "Place Order"
5. You'll be redirected to VNPay sandbox
6. Use test card credentials:
   - Bank: NCB
   - Card Number: 9704198526191432198
   - Card Name: NGUYEN VAN A
   - Expiry: 07/15
   - OTP: 123456

7. After successful payment, you'll be redirected back to `/checkout/vnpay-return`

### 5. Changes Made

#### Backend:
- ✅ Added `VNPAY_RETURN_URL` and `VNPAY_IPN_URL` to `.env`
- ✅ Updated `VNPayService` to use configured URLs
- ✅ Made `returnUrl` optional in `VNPayPaymentRequestDto`

#### Frontend:
- ✅ Created `VNPayReturnPage.tsx` to handle payment callback
- ✅ Added route `/checkout/vnpay-return`
- ✅ Displays success/failure message with transaction details

### 6. Troubleshooting

**If you still see "Website not approved":**
1. Double-check URLs are whitelisted in VNPay merchant portal
2. Make sure URLs match exactly (including http/https, port numbers)
3. Wait a few minutes after whitelisting (VNPay may need time to sync)
4. Clear browser cache and try again

**For Production Deployment:**
Update `.env` file with your production URLs:
```env
VNPAY_RETURN_URL=https://yourdomain.com/checkout/vnpay-return
VNPAY_IPN_URL=https://yourdomain.com/checkout/vnpay-ipn
FRONTEND_URL=https://yourdomain.com
```

### 7. IPN (Instant Payment Notification)

The IPN endpoint (`/checkout/vnpay-ipn`) is already implemented in the backend:
- Verifies payment signature
- Updates order status to CONFIRMED on successful payment
- Handles inventory deduction
- Is idempotent (handles duplicate calls safely)

### 8. Payment Flow Diagram

```
User clicks "Place Order"
        ↓
Frontend calls /checkout/create-payment
        ↓
Backend creates order (PENDING_PAYMENT)
        ↓
Backend generates VNPay URL
        ↓
User is redirected to VNPay
        ↓
User completes payment
        ↓
VNPay calls IPN endpoint (backend)
        ↓
Backend updates order status
        ↓
VNPay redirects user to return URL
        ↓
Frontend shows success/failure message
```

## Need Help?

If you encounter any issues, check:
1. Backend console logs for errors
2. Browser console for frontend errors
3. VNPay merchant portal for configuration issues
4. Network tab in browser DevTools to see API calls
