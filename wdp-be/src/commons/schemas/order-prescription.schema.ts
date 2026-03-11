import { Schema } from 'mongoose';

export const OrderPrescriptionSchema = new Schema({
  pd: { type: Number, required: true },
  sph: {
    right: { type: Number, required: true },
    left: { type: Number, required: true },
  },
  cyl: {
    right: { type: Number, required: true },
    left: { type: Number, required: true },
  },
  axis: {
    right: { type: Number, required: true },
    left: { type: Number, required: true },
  },
  add: {
    right: { type: Number, required: true },
    left: { type: Number, required: true },
  },
}, { _id: false });

// TypeScript type for the document
export interface OrderPrescription {
  pd: number;
  sph: {
    right: number;
    left: number;
  };
  cyl: {
    right: number;
    left: number;
  };
  axis: {
    right: number;
    left: number;
  };
  add: {
    right: number;
    left: number;
  };
}
