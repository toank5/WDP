/**
 * Return Request Status Flow
 *
 * Customer submits → SUBMITTED → AWAITING_ITEMS (auto-transition)
 * Items arrive → AWAITING_ITEMS → IN_REVIEW (staff marks received)
 * Sale staff inspects → IN_REVIEW → APPROVED (sets condition + resolution)
 * Operation staff → APPROVED → COMPLETED (processes inventory)
 * Sale staff → APPROVED → COMPLETED (processes refund)
 *
 * REJECTED: Can be rejected at any point (policy, condition, etc.)
 * CANCELED: Customer can cancel their return
 */
export enum RETURN_STATUS {
  SUBMITTED = 'SUBMITTED', // Customer submitted return form
  AWAITING_ITEMS = 'AWAITING_ITEMS', // Waiting for customer to ship items
  IN_REVIEW = 'IN_REVIEW', // Items received, Sale staff inspecting
  APPROVED = 'APPROVED', // Resolution decided (refund/exchange approved)
  REJECTED = 'REJECTED', // Return rejected (any reason)
  COMPLETED = 'COMPLETED', // Refund/exchange processed + inventory updated
  CANCELED = 'CANCELED', // Customer canceled the return
}

/**
 * Return Item Status (item-level tracking for inventory)
 *
 * AWAITING_RETURN → ITEM_RECEIVED → RESALEABLE / DAMAGED / SCRAPPED
 */
export enum RETURN_ITEM_STATUS {
  AWAITING_RETURN = 'AWAITING_RETURN', // Customer hasn't sent item yet
  ITEM_RECEIVED = 'ITEM_RECEIVED', // Warehouse received item
  RESALEABLE = 'RESALEABLE', // Can be returned to stock
  DAMAGED = 'DAMAGED', // Damaged but may be repairable
  SCRAPPED = 'SCRAPPED', // Cannot be resold
}

/**
 * Return Item Condition (for Sale Staff inspection)
 *
 * PENDING → RESELLABLE / DAMAGED_UNUSABLE
 */
export enum RETURN_ITEM_CONDITION {
  PENDING = 'PENDING', // Not inspected yet
  RESELLABLE = 'RESELLABLE', // Looks new, can be sold again
  DAMAGED_UNUSABLE = 'DAMAGED_UNUSABLE', // Broken/used, cannot be sold
}

/**
 * Return Reason options
 */
export enum RETURN_REASON {
  DAMAGED = 'DAMAGED',
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  NO_LONGER_NEEDED = 'NO_LONGER_NEEDED',
  CHANGE_OF_MIND = 'CHANGE_OF_MIND',
  PRESCRIPTION_CHANGE = 'PRESCRIPTION_CHANGE',
  OTHER = 'OTHER',
}

/**
 * Return Type options
 */
export enum RETURN_TYPE {
  REFUND = 'REFUND',
  EXCHANGE = 'EXCHANGE',
}
