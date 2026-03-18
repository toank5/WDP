const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/wdp-dev')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const promotionSchema = new mongoose.Schema({
  code: String,
  name: String,
  type: String,
  value: Number,
  minOrderValue: Number,
  maxDiscountAmount: Number,
  status: String,
}, { _id: false });

const Promotion = mongoose.model('Promotion', promotionSchema, 'promotions');

Promotion.findOne({ code: 'TEST001' }).then(promo => {
  if (promo) {
    console.log('Promotion found:', {
      code: promo.code,
      name: promo.name,
      type: promo.type,
      typeType: typeof promo.type,
      value: promo.value,
      valueType: typeof promo.value,
      minOrderValue: promo.minOrderValue,
      maxDiscountAmount: promo.maxDiscountAmount,
      status: promo.status,
    });
  } else {
    console.log('No promotion found with code TEST001');
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
