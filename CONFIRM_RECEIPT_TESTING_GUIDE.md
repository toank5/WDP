# "Confirm Receipt" Implementation - Testing Guide

## Overview
This document provides a complete testing guide for the "Confirm Receipt" feature implementation.

## Pre-Testing Checklist

### Backend Verification
- [ ] `wdp-be/src/services/order.service.ts` - `confirmReceipt()` method added
- [ ] `wdp-be/src/controllers/order.controller.ts` - POST endpoint `/orders/:id/confirm-receipt` added
- [ ] OrderService imports include: `mongoose`, `Types`
- [ ] OrderModule properly wires all dependencies
- [ ] Inventory model collection is properly injected

### Frontend Verification
- [ ] `FE/src/lib/order-api.ts` - `confirmReceipt()` method added
- [ ] `FE/src/pages/store/OrderDetailPage.tsx` - Button and handlers added
- [ ] Tailwind CSS classes are available in project
- [ ] Icons (FiCheckCircle) are properly imported

### Environment Setup
- [ ] Backend running on port 3000 (or configured port)
- [ ] Frontend running on port 5173 (or configured port)
- [ ] MongoDB is running and accessible
- [ ] JWT tokens are valid and properly configured

## Testing Scenarios

### Scenario 1: Happy Path - Confirm Receipt Successfully

#### Setup
1. Create a new order through checkout
2. Simulate payment completion (move status to CONFIRMED)
3. Simulate order packing & shipping (move status to SHIPPED)

#### Steps
1. Navigate to order details page
2. Verify "Confirm Received" button is visible
3. Verify button text is "Confirm Received"
4. Verify button is styled with emerald-600 color
5. Click "Confirm Received" button
6. Confirm dialog appears with message "Mark this order as delivered? This will finalize the inventory."
7. Click "OK" on confirmation dialog

#### Expected Results
- [ ] Loading state: Button shows "Confirming..." text
- [ ] Button is disabled during API call
- [ ] Success toast appears: "Order marked as delivered successfully"
- [ ] Toast is emerald green background with white text
- [ ] Order status updates to "DELIVERED" in UI
- [ ] "Confirm Received" button disappears
- [ ] Order history shows new entry:
  - Status: DELIVERED
  - Note: "Customer receipt confirmed by operations staff"
  - Timestamp: Current date/time
- [ ] Tracking.actualDelivery is set to current timestamp
- [ ] Order can no longer have receipt confirmed (button gone)

#### Database Verification
```mongodb
// Check order status updated
db.orders.findOne({ _id: ObjectId("...") })
// Should show: orderStatus: "DELIVERED", tracking: { actualDelivery: ISODate("...") }

// Check inventory deducted
db.inventories.findOne({ sku: "VT-001-BLK-M" })
// Should show: stockQuantity decreased by order quantity, reservedQuantity decreased

// Check movement record created
db.inventorymovements.findOne({ reference: OrderId, movementType: "CONFIRMED" })
// Should show: quantity negative, reason contains order number
```

### Scenario 2: Order Not in SHIPPED Status

#### Setup
1. Create order and stop at CONFIRMED status (don't ship)

#### Steps
1. Navigate to order details page
2. Observe that "Confirm Received" button is NOT visible

#### Expected Results
- [ ] Button is hidden (only visible when status === SHIPPED)
- [ ] No error message is displayed
- [ ] User cannot attempt confirm receipt action

### Scenario 3: Multiple Items in Order

#### Setup
1. Create order with multiple items (e.g., 3 different products)
2. Progress order to SHIPPED status

#### Steps
1. Click "Confirm Received" button
2. Confirm delivery

#### Database Verification
- [ ] Inventory records for ALL SKUs in order are updated
- [ ] Movement records created for EACH item
- [ ] Total quantities deducted correctly

```mongodb
// Check all items processed
db.inventorymovements.find({ 
  reference: ObjectId("..."), 
  movementType: "CONFIRMED" 
}).toArray()
// Should show: multiple records, one for each order item
```

### Scenario 4: Network Error During Confirm

#### Setup
1. Simulate network error (disconnect WiFi, use DevTools to throttle)
2. Order is at SHIPPED status

#### Steps
1. Click "Confirm Received" button
2. Confirm dialog
3. Network error occurs during API call

#### Expected Results
- [ ] Loading state: Button shows "Confirming..."
- [ ] API call times out or fails
- [ ] Error toast appears with error message
- [ ] Toast is red background with white text
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Button returns to normal state (not disabled)
- [ ] Order status remains SHIPPED (unchanged)
- [ ] User can retry confirmation

### Scenario 5: Inventory Validation Failures

#### Setup
1. Manually delete or reduce inventory for order SKU
2. Order is at SHIPPED status

#### Steps
1. Click "Confirm Received" button
2. Confirm dialog

#### Expected Results
- [ ] API returns error 400
- [ ] Error toast shows message like "Insufficient reserved stock for SKU..."
- [ ] Order status remains SHIPPED
- [ ] Inventory is NOT modified (transaction rolled back)
- [ ] User can investigate and retry

### Scenario 6: Order Already Delivered

#### Setup
1. Confirm receipt for an order (successful delivery)
2. Return to the order details page

#### Steps
1. Refresh page
2. Observe order status and button state

#### Expected Results
- [ ] Order status displays as "DELIVERED"
- [ ] Status badge is emerald green with "Delivered" label
- [ ] "Confirm Received" button is NOT visible
- [ ] User cannot confirm receipt again
- [ ] Order history shows delivery confirmation entry

### Scenario 7: Authorization - Customer Access

#### Setup
1. Log in as CUSTOMER user
2. Navigate to own order that is SHIPPED

#### Steps
1. Try to confirm receipt (if button appears)

#### Expected Results
- [ ] Button may be visible (shows if status is SHIPPED)
- [ ] Clicking button attempts API call
- [ ] API returns 403 Forbidden (or buttons should be role-gated)
- [ ] Error toast shows permission error

### Scenario 8: Authorization - Staff Access

#### Setup
1. Log in as OPERATION (Staff) user
2. Navigate to any order that is SHIPPED

#### Steps
1. Click "Confirm Received" button
2. Confirm delivery

#### Expected Results
- [ ] Button is visible and enabled
- [ ] API call succeeds (200 OK)
- [ ] Order status updates to DELIVERED
- [ ] Inventory is properly deducted

### Scenario 9: Toast Notification Auto-Dismiss

#### Steps
1. Confirm receipt successfully
2. Success toast appears
3. Wait 3 seconds without interacting

#### Expected Results
- [ ] Toast appears with message
- [ ] Toast automatically disappears after 3 seconds
- [ ] No manual close button needed

#### For Error Toast
1. Trigger error condition
2. Error toast appears
3. Wait 5 seconds without interacting

#### Expected Results
- [ ] Error toast appears
- [ ] Toast automatically disappears after 5 seconds (longer than success)

## API Testing with cURL

### Prerequisites
```bash
# Get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@example.com","password":"password"}'
# Copy the token from response
```

### Test Endpoint
```bash
# Replace TOKENS and ORDER_ID
curl -X POST http://localhost:3000/orders/507f1f77bcf86cd799439011/confirm-receipt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"
```

### Success Response (200)
```json
{
  "statusCode": 200,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1649200000-1234",
    "orderStatus": "DELIVERED",
    "items": [...],
    "tracking": {
      "carrier": "GHN",
      "trackingNumber": "123456789",
      "actualDelivery": "2026-03-09T10:30:00.000Z"
    },
    "history": [
      {
        "status": "DELIVERED",
        "timestamp": "2026-03-09T10:30:00.000Z",
        "note": "Customer receipt confirmed by operations staff"
      }
    ]
  }
}
```

### Error Responses
```bash
# Test with wrong status (CONFIRMED instead of SHIPPED)
# Expected: 400 Bad Request

# Test without authorization header
# Expected: 401 Unauthorized

# Test with customer role
# Expected: 403 Forbidden (if role check not in button)

# Test with invalid order ID
# Expected: 404 Not Found
```

## UI Component Testing

### Visual Checks
- [ ] Button styling matches design specs
- [ ] Button text is "Confirm Received"
- [ ] Button icon (FiCheckCircle) displays correctly
- [ ] Button color is emerald-600 on normal state
- [ ] Button color is emerald-700 on hover state
- [ ] Button is disabled during loading (opacity-50)
- [ ] Toast position is top-right (fixed positioning)
- [ ] Toast styling is correct (emerald for success, red for error)
- [ ] Toast text is readable

### Responsive Testing
- [ ] Button layout on mobile (< 640px)
- [ ] Button layout on tablet (640px - 1024px)
- [ ] Button layout on desktop (> 1024px)
- [ ] Toast position on mobile
- [ ] Touch/tap functionality on mobile

## Performance Testing

### Load Time
- [ ] API response time: < 1000ms
- [ ] UI update after response: < 500ms
- [ ] Toast animation smooth

### Stress Testing
- [ ] Rapidly click button multiple times
  - Expected: Request deduplicated or queued
  - Should not send multiple concurrent requests
- [ ] Click button, then immediately navigate away
  - Expected: Graceful cleanup, no console errors
- [ ] Large orders (100+ items) confirm receipt
  - Expected: All items processed correctly

## Edge Cases Testing

### Multiple Concurrent Requests
1. Open order 1 in tab 1
2. Open order 2 in tab 2
3. Click confirm in tab 1
4. While loading, click confirm in tab 2
5. Check both complete successfully without conflicts

### Invalid Order Data
1. Create order with deleted/invalid SKU
2. Try to confirm receipt
3. Expected: Proper error handling (404 or 400)

### Inventory Edge Cases
1. Reserved quantity equals expected quantity exactly
2. Stock quantity equals reserved quantity exactly
3. Available quantity is 0
4. Multiple orders for same SKU confirm simultaneously

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Console Checks

- [ ] No console errors during normal flow
- [ ] No console warnings about missing props
- [ ] No console errors during error scenarios
- [ ] Network tab shows successful API request
- [ ] Network request headers include Authorization token
- [ ] Network response includes proper JSON structure

## Completion Checklist

After completing all test scenarios, verify:
- [ ] All backend routes working correctly
- [ ] All inventory calculations correct
- [ ] All database records properly created
- [ ] All frontend UI updates working
- [ ] All error handling working
- [ ] All authorization checks working
- [ ] Toast notifications displaying correctly
- [ ] Button state management working
- [ ] Mobile responsive design working
- [ ] No console errors or warnings
- [ ] Performance acceptable (API response < 1s)
- [ ] Cross-browser compatibility verified

## Regression Testing

After confirming receipt feature is working, test these existing features:
- [ ] Cancel order still works
- [ ] Order status updates still work
- [ ] Order history still displays correctly
- [ ] Inventory adjustments from admin panel still work
- [ ] Stock reservation on new orders still works
- [ ] Payment processing still works

## Deployment Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Code review completed
- [ ] Database migrations verified
- [ ] Error logs reviewed
- [ ] Performance monitoring set up
- [ ] Rollback plan documented
- [ ] User documentation updated
- [ ] Team training completed

## Known Limitations & Future Enhancements

### Current Limitations
- Single confirmation per order (no bulk operations)
- No reversal/undo after confirmation
- No email notifications sent to customer

### Future Enhancements
- Bulk confirm receipts for multiple orders
- Scheduled auto-confirmation based on tracking events
- Email notifications to customer on delivery
- SMS notifications to customer
- Return order handling (reversal of inventory)
- Analytics dashboard for delivery metrics
