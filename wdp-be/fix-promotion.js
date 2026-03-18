const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/wdp-dev')
  .then(() => console.log('Connected'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const promotionSchema = new mongoose.Schema({}, { strict: false });
const Promotion = mongoose.model('Promotion', promotionSchema, 'promotions');

Promotion.find({}).then(promos => {
  console.log('Found', promos.length, 'promotions');
  if (promos.length === 0) {
    console.log('No promotions found!');
    mongoose.connection.close();
    process.exit(0);
  }
  
  const promo = promos[0];
  console.log('\nBefore fix:', {
    code: promo.code,
    type: promo.type,
    value: promo.value,
    maxDiscountAmount: promo.maxDiscountAmount,
  });
  
  // Fix: remove or increase the max discount amount
  return Promotion.findByIdAndUpdate(
    promo._id,
    { maxDiscountAmount: null }, // null = no limit
    { new: true }
  );
}).then(updated => {
  console.log('\nAfter fix:', {
    code: updated.code,
    type: updated.type,
    value: updated.value,
    maxDiscountAmount: updated.maxDiscountAmount,
  });
  console.log('\nWith maxDiscountAmount=null:');
  console.log('  For 870,000 cart:');
  console.log('    discount = (870000 × 10) / 100 = 87,000');
  console.log('    final = 870,000 - 87,000 = 783,000');
  mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});
