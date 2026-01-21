import { Inventory } from '../schemas/inventory.schema';

export const inventoryValidation = {
  sku: {
    presence: true,
    length: {
      min: 5,
      max: 100,
    },
    errorMsg: 'SKU is invalid',
  },
  stockQuantity: {
    presence: true,
    number: true,
    min: 0,
    errorMsg: 'Stock quantity is invalid',
  },
  reservedQuantity: {
    presence: true,
    number: true,
    min: 0,
    validator: function (value: number): boolean {
      return value <= (this as Inventory).stockQuantity;
    },
    errorMsg: 'Reserved quantity is invalid',
  },
  availableQuantity: {
    presence: true,
    number: true,
    min: 0,
    validator: function (value: number): boolean {
      return (
        value ===
        (this as Inventory).stockQuantity - (this as Inventory).reservedQuantity
      );
    },
    errorMsg: 'Available quantity is invalid',
  },
  reorderLevel: {
    presence: true,
    number: true,
    min: 0,
    errorMsg: 'Reorder level is invalid',
  },
  supplier: {
    presence: true,
    errorMsg: 'Supplier is invalid',
    name: {
      presence: true,
      length: {
        min: 1,
        max: 100,
      },
      errorMsg: 'Supplier name is invalid',
    },
    expectedArrival: {
      presence: true,
      date: true,
      errorMsg: 'Expected arrival is invalid',
    },
  },
};
