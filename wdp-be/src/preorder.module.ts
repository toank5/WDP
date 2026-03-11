import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PreorderController } from './controllers/preorder.controller';
import { PreorderService } from './services/preorder.service';
import { OrderSchema } from './commons/schemas/order.schema';
import { ProductSchema } from './commons/schemas/product.schema';
import { InventoryMovementSchema } from './commons/schemas/inventory-movement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'InventoryMovement', schema: InventoryMovementSchema },
    ]),
  ],
  controllers: [PreorderController],
  providers: [PreorderService],
  exports: [PreorderService],
})
export class PreorderModule {}
