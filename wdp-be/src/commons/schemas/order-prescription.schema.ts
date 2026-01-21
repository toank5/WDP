import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderPrescription {
  @Prop()
  pd: number;

  @Prop()
  sph: {
    right: number;
    left: number;
  };

  @Prop()
  cyl: {
    right: number;
    left: number;
  };

  @Prop()
  axis: {
    right: number;
    left: number;
  };

  @Prop()
  add: {
    right: number;
    left: number;
  };
}
