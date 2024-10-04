const mongoose = require('mongoose');

const credentials_schema = mongoose.Schema({
    utype: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
});

module.exports = mongoose.model("users", credentials_schema, "Users");
 