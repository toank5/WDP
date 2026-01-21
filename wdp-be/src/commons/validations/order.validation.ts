import validator from 'validator';
import { ORDER_STATUS, ORDER_TYPES } from '../enums/order.enum';
export const orderValidation = {
  number: {
    presence: true,
    uniqueness: true,
    validator: function (value: string) {
      return validator.matches(value, /^ORD-\d+$/);
    },
    errorMsg: 'Order number is invalid',
  },

  type: {
    presence: true,
    errorMsg: 'Order type is invalid',
    validator: function (value: string) {
      return Object.values(ORDER_TYPES).includes(value);
    },
  },

  status: {
    presence: true,
    errorMsg: 'Order status is invalid',
    validator: function (value: string) {
      return Object.values(ORDER_STATUS).includes(value);
    },
  },
};
