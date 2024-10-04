const mongoose = require('mongoose');

const products_schema = mongoose.Schema({
    product_name: { type: String, required: true },
    price: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    stock: { type: Number, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' } 
});


module.exports = mongoose.model("products", products_schema, "products");
