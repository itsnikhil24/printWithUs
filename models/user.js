let mongoose = require('mongoose');

// mongoose.connect(`mongodb+srv://nikhil:123@backendlearning.f16cp.mongodb.net/`);
mongoose.connect(`mongodb://localhost:27017/printWithUs`); 

const userschema = mongoose.Schema({
    email: String,
    username:String,
    password: String,

});

module.exports = mongoose.model('shopkeeper', userschema);