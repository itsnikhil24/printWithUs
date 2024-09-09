let mongoose = require('mongoose');
const customer = require('./customer');

// mongoose.connect(`mongodb+srv://nikhil:123@backendlearning.f16cp.mongodb.net/`);
// mongoose.connect(`mongodb://localhost:27017/printWithUs`); 

const orderschema = mongoose.Schema({
    Name: String,
    Contact_Number:Number,
    Email: String,
    Preferred_Time_Slot:String,
    Select_Service:String,
    Number_of_Copies:Number,
    Paper_Size:Number,
    // status:{
    //     type:String,
    //     enum:["orderplaced","printed"],
    //     default:"orderplaced"
    // },
    user:{type: mongoose.Schema.Types.ObjectId,
        ref:"customer"
    }
   
}, {timestamps:true});

module.exports = mongoose.model('orders', orderschema);