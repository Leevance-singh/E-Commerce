const mongoose = require('mongoose');

const user_data = mongoose.Schema({
    _id: { type: String, required: true },
    products: [{
        product_id: { type: String, required: true },
        stock: { type: Number, required: true }
    }]
});

module.exports = mongoose.model("user_data", user_data, "user_data");
 