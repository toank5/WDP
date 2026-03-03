const mongoose = require('mongoose');
const Product = require('./dist/commons/schemas/product.schema').Product;

mongoose.connect('mongodb://localhost:27017/wdp')
  .then(async () => {
    const products = await Product.find({ isDeleted: false }).limit(3);
    console.log('Found', products.length, 'products');
    products.forEach(p => {
      console.log('Product:', p.name);
      console.log('  images2D:', p.images2D?.length || 0, 'images');
      console.log('  images3D:', p.images3D?.length || 0, 'images');
      console.log('  First image2D:', p.images2D?.[0] || 'none');
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
