# Transaction Pattern Guide

## Overview

This guide explains how to use MongoDB transactions consistently across all service methods in the WDP backend.

## The Transaction Utility

We've created a reusable `withTransaction` utility in `src/commons/utils/transaction.util.ts` that handles:

- Starting a session
- Beginning a transaction
- Committing on success
- Aborting on error
- Cleaning up the session

## Usage Pattern

### 1. Basic Setup in Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { withTransaction } from 'src/commons/utils/transaction.util';

@Injectable()
export class YourService {
  constructor(@InjectConnection() private readonly connection: Connection) {}
}
```

### 2. Using Transactions in Methods

```typescript
async createUser(data: CreateUserDto): Promise<CustomApiResponse<User>> {
  return withTransaction(this.connection, async (session) => {
    // All database operations must pass { session } option
    const user = await this.userModel.create([data], { session });
    const profile = await this.profileModel.create(
      [{ userId: user[0]._id }],
      { session }
    );

    return new CustomApiResponse(201, 'User created', user[0]);
  });
}
```

### 3. Important Rules

**✅ DO:**

- Always pass `{ session }` to ALL database operations within the transaction
- Use array syntax for `create()`: `Model.create([data], { session })`
- Return the final result from the callback
- Let errors bubble up (they will auto-abort the transaction)

**❌ DON'T:**

- Forget to pass `{ session }` to any database operation
- Mix transactional and non-transactional operations
- Catch errors inside the transaction callback (unless re-throwing)

## Examples

### Example 1: Simple Create Operation

```typescript
async createProduct(data: CreateProductDto): Promise<CustomApiResponse<Product>> {
  return withTransaction(this.connection, async (session) => {
    const product = await this.productModel.create([data], { session });

    // Create inventory record
    await this.inventoryModel.create(
      [{
        sku: product[0].sku,
        stockQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
      }],
      { session }
    );

    return new CustomApiResponse(201, 'Product created', product[0]);
  });
}
```

### Example 2: Update with Related Records

```typescript
async updateOrder(
  orderId: string,
  data: UpdateOrderDto
): Promise<CustomApiResponse<Order>> {
  return withTransaction(this.connection, async (session) => {
    // Find and update order
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      data,
      { new: true, session }
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update inventory
    for (const item of order.items) {
      await this.inventoryModel.updateOne(
        { sku: item.variantSku },
        { $inc: { reservedQuantity: item.quantity } },
        { session }
      );
    }

    return new CustomApiResponse(200, 'Order updated', order);
  });
}
```

### Example 3: Complex Multi-Step Operation

```typescript
async placeOrder(data: PlaceOrderDto): Promise<CustomApiResponse<Order>> {
  return withTransaction(this.connection, async (session) => {
    // 1. Validate inventory
    for (const item of data.items) {
      const inventory = await this.inventoryModel.findOne(
        { sku: item.sku },
        { session }
      );

      if (!inventory || inventory.availableQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.sku}`);
      }
    }

    // 2. Create order
    const order = await this.orderModel.create([data], { session });

    // 3. Update inventory
    for (const item of data.items) {
      await this.inventoryModel.updateOne(
        { sku: item.sku },
        {
          $inc: {
            reservedQuantity: item.quantity,
            availableQuantity: -item.quantity,
          },
        },
        { session }
      );
    }

    // 4. Clear cart
    await this.cartModel.deleteOne(
      { customerId: data.customerId },
      { session }
    );

    return new CustomApiResponse(201, 'Order placed successfully', order[0]);
  });
}
```

### Example 4: Delete with Cascade

```typescript
async deleteProduct(productId: string): Promise<CustomApiResponse<void>> {
  return withTransaction(this.connection, async (session) => {
    // Delete product
    const product = await this.productModel.findByIdAndDelete(
      productId,
      { session }
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete related inventory
    await this.inventoryModel.deleteOne(
      { sku: product.sku },
      { session }
    );

    // Delete from all carts
    await this.cartModel.updateMany(
      { 'items.productId': productId },
      { $pull: { items: { productId } } },
      { session }
    );

    return new CustomApiResponse(200, 'Product deleted successfully');
  });
}
```

## When to Use Transactions

Use transactions when:

- Creating/updating multiple related documents
- Operations that must be atomic (all succeed or all fail)
- Updating inventory or financial data
- Complex business logic involving multiple collections

You may skip transactions for:

- Simple read operations
- Single document updates with no side effects
- Operations where eventual consistency is acceptable

## Error Handling

Errors thrown inside the transaction callback will:

1. Automatically abort the transaction
2. Roll back all changes
3. Propagate to the caller

```typescript
async example(): Promise<CustomApiResponse<any>> {
  return withTransaction(this.connection, async (session) => {
    // If this throws, transaction auto-aborts
    const result = await this.model.create([data], { session });

    if (!result) {
      // This will abort the transaction
      throw new BadRequestException('Creation failed');
    }

    return new CustomApiResponse(200, 'Success', result[0]);
  });
}
```

## Performance Considerations

- Transactions add overhead - use them only when needed
- Keep transactions short and focused
- Avoid long-running operations inside transactions
- Don't make external API calls inside transactions
