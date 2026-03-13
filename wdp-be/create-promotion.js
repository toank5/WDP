const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/wdp-dev')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const promotionSchema = new mongoose.Schema({}, { _id: false, strict: false });
const Promotion = mongoose.model('Promotion', promotionSchema, 'promotions');

const now = new Date();
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);

// Create TEST001 - 10% percentage discount
const testPromo = {
  code: 'TEST001',
  name: 'Test 10% Discount',
  description: '10% off for testing',
  type: 'percentage',
  value: 10,  // 10% - stored as whole number
  minOrderValue: 0,
  maxDiscountAmount: null,
  scope: 'all_orders',
  applicableCategories: [],
  applicableProductIds: [],
  startDate: now,
  endDate: nextYear,
  usageLimit: 1000,
  usageCount: 0,
  maxUsesPerCustomer: 5,
  status: 'active',
  isStackable: false,
  tags: ['test'],
  isFeatured: false,
  createdAt: now,
  updatedAt: now,
};

Promotion.create(testPromo).then(p => {
  console.log('Promotion created successfully:', {
    code: p.code,
    name: p.name,
    type: p.type,
    value: p.value,
    minOrderValue: p.minOrderValue,
    status: p.status,
  });
  console.log('\nWith value=10 and type=percentage:');
  console.log('  For 870,000 cart: discount = (870000 * 10) / 100 = 87,000');
  process.exit(0);
}).catch(err => {
  console.error('Error creating promotion:', err);
  process.exit(1);
});
