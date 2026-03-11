const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/wdp-dev')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const promotionSchema = new mongoose.Schema({}, { _id: false, strict: false });
const Promotion = mongoose.model('Promotion', promotionSchema, 'promotions');

Promotion.find({}).then(promos => {
  console.log('All promotions in database:');
  promos.forEach(p => {
    console.log({
      code: p.code,
      name: p.name,
      type: p.type,
      typeType: typeof p.type,
      value: p.value,
      minOrderValue: p.minOrderValue,
      maxDiscountAmount: p.maxDiscountAmount,
      status: p.status,
    });
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
