/**
 * Return-related constants shared between frontend and backend
 */

import { RETURN_STATUS, RETURN_REASON } from '../enums/return.enums';

/**
 * Return Status Display Labels
 */
export const RETURN_STATUS_LABELS: Record<RETURN_STATUS, string> = {
  [RETURN_STATUS.SUBMITTED]: 'Return Submitted',
  [RETURN_STATUS.AWAITING_ITEMS]: 'Awaiting Return Items',
  [RETURN_STATUS.IN_REVIEW]: 'Under Review',
  [RETURN_STATUS.APPROVED]: 'Approved',
  [RETURN_STATUS.REJECTED]: 'Rejected',
  [RETURN_STATUS.COMPLETED]: 'Completed',
  [RETURN_STATUS.CANCELED]: 'Canceled',
};

/**
 * Return Reason Display Labels
 */
export const RETURN_REASON_LABELS: Record<RETURN_REASON, string> = {
  [RETURN_REASON.DAMAGED]: 'Item Arrived Damaged',
  [RETURN_REASON.DEFECTIVE]: 'Defective Product',
  [RETURN_REASON.WRONG_ITEM]: 'Wrong Item Received',
  [RETURN_REASON.NOT_AS_DESCRIBED]: 'Not as Described',
  [RETURN_REASON.NO_LONGER_NEEDED]: 'No Longer Needed',
  [RETURN_REASON.CHANGE_OF_MIND]: 'Change of Mind',
  [RETURN_REASON.PRESCRIPTION_CHANGE]: 'Prescription Changed',
  [RETURN_REASON.OTHER]: 'Other',
};

/**
 * Return Status Color Mapping for UI
 */
export const RETURN_STATUS_COLORS: Record<RETURN_STATUS, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  [RETURN_STATUS.SUBMITTED]: 'info',
  [RETURN_STATUS.AWAITING_ITEMS]: 'info',
  [RETURN_STATUS.IN_REVIEW]: 'warning',
  [RETURN_STATUS.APPROVED]: 'success',
  [RETURN_STATUS.REJECTED]: 'error',
  [RETURN_STATUS.COMPLETED]: 'success',
  [RETURN_STATUS.CANCELED]: 'default',
};
