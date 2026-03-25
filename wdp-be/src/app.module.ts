import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { User, UserSchema } from './commons/schemas/user.schema';
import { Address, AddressSchema } from './commons/schemas/address.schema';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { PolicyController } from './controllers/policy.controller';
import { PolicyService } from './services/policy.service';
import { Policy, PolicySchema } from './commons/schemas/policy.schema';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { Product, ProductSchema } from './commons/schemas/product.schema';
import { CloudinaryService } from './commons/services/cloudinary.service';
import { FileUploadService } from './commons/services/file-upload.service';
import { MediaService } from './commons/services/media.service';
import { MediaController } from './controllers/media.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { InventoryController } from './controllers/inventory.controller';
import { PublicInventoryController } from './controllers/public-inventory.controller';
import { InventoryService } from './services/inventory.service';
import { Inventory, InventorySchema } from './commons/schemas/inventory.schema';
import {
  SupplierController,
  PublicSupplierController,
} from './controllers/supplier.controller';
import { SupplierService } from './services/supplier.service';
import { Supplier, SupplierSchema } from './commons/schemas/supplier.schema';
import {
  InventoryMovement,
  InventoryMovementSchema,
} from './commons/schemas/inventory-movement.schema';
import { CartController } from './controllers/cart.controller';
import { CartService } from './services/cart.service';
import { Cart, CartSchema } from './commons/schemas/cart.schema';
import { CartItem, CartItemSchema } from './commons/schemas/cart-item.schema';
import { CheckoutController } from './controllers/checkout.controller';
import { CheckoutService } from './services/checkout.service';
import {
  OrderController,
  StaffOrderController,
  StaffPrescriptionController,
} from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { Order, OrderSchema } from './commons/schemas/order.schema';
import {
  OrderItem,
  OrderItemSchema,
} from './commons/schemas/order-item.schema';
import {
  OrderPayment,
  OrderPaymentSchema,
} from './commons/schemas/order-payment.schema';
import {
  OrderTracking,
  OrderTrackingSchema,
} from './commons/schemas/order-tracking.schema';
import {
  OrderHistory,
  OrderHistorySchema,
} from './commons/schemas/order-history.schema';
import {
  WorkOrder,
  WorkOrderSchema,
} from './commons/schemas/work-order.schema';
import { VNPayService } from './services/vnpay.service';
import {
  ProductVariant,
  ProductVariantSchema,
} from './commons/schemas/product-variant.schema';
import { PreorderModule } from './preorder.module';
import { ReviewController } from './controllers/review.controller';
import { ReviewService } from './services/review.service';
import { Review, ReviewSchema } from './commons/schemas/review.schema';
import {
  ComboController,
  PublicComboController,
} from './controllers/combo.controller';
import { ComboService } from './services/combo.service';
import { Combo, ComboSchema } from './commons/schemas/combo.schema';
import {
  PromotionController,
  PublicPromotionController,
} from './controllers/promotion.controller';
import { PromotionService } from './services/promotion.service';
import { Promotion, PromotionSchema } from './commons/schemas/promotion.schema';
import { AccountController } from './controllers/account.controller';
import { RevenueController } from './controllers/revenue.controller';
import { RevenueService } from './services/revenue.service';
import {
  CustomerReturnController,
  StaffReturnController,
} from './controllers/return.controller';
import { ReturnService } from './services/return.service';
import {
  ReturnRequest,
  ReturnRequestSchema,
} from './commons/schemas/return.schema';
import { FavoriteController } from './controllers/favorite.controller';
import { FavoriteService } from './services/favorite.service';
import { Favorite, FavoriteSchema } from './commons/schemas/favorite.schema';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get('NODE_ENV') === 'production'
            ? `mongodb+srv://${configService.get('DB_USERNAME')}:${configService.get('DB_PASSWORD')}@${configService.get('DB_HOST')}/${configService.get('DB_NAME')}`
            : configService.get('MONGODB_URI_LOCAL'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: Address.name,
        schema: AddressSchema,
      },
      {
        name: Policy.name,
        schema: PolicySchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Inventory.name,
        schema: InventorySchema,
      },
      {
        name: Supplier.name,
        schema: SupplierSchema,
      },
      {
        name: InventoryMovement.name,
        schema: InventoryMovementSchema,
      },
      {
        name: ProductVariant.name,
        schema: ProductVariantSchema,
      },
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: OrderPayment.name, schema: OrderPaymentSchema },
      { name: OrderTracking.name, schema: OrderTrackingSchema },
      { name: OrderHistory.name, schema: OrderHistorySchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Combo.name, schema: ComboSchema },
      { name: Promotion.name, schema: PromotionSchema },
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
    PreorderModule,
    HealthModule,
  ],
  controllers: [
    AppController,
    AuthController,
    AccountController,
    UserController,
    PolicyController,
    ProductController,
    InventoryController,
    PublicInventoryController,
    SupplierController,
    PublicSupplierController,
    MediaController,
    CartController,
    OrderController,
    StaffOrderController,
    StaffPrescriptionController,
    CheckoutController,
    ReviewController,
    ComboController,
    PublicComboController,
    PromotionController,
    PublicPromotionController,
    RevenueController,
    CustomerReturnController,
    StaffReturnController,
    FavoriteController,
  ],
  providers: [
    AppService,
    JwtService,
    JwtStrategy,
    AuthService,
    UserService,
    PolicyService,
    ProductService,
    InventoryService,
    SupplierService,
    CloudinaryService,
    FileUploadService,
    MediaService,
    CartService,
    OrderService,
    CheckoutService,
    VNPayService,
    ReviewService,
    ComboService,
    PromotionService,
    RevenueService,
    ReturnService,
    FavoriteService,
  ],
})
export class AppModule {}
