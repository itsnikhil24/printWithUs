const express =require('express');
const app=express();
const path=require("path");
const fs=require('fs');
const usermodel=require('./models/customer.js')
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const cookieparser=require('cookie-parser');
const customer = require('./models/customer.js');
const pdf = require('pdf-page-counter');
const multer = require('multer');
const Order = require('./models/ordermodel.js');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieparser()); // Add this to parse cookies in requests


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Save file with timestamp
    }
});
const upload = multer({ storage: storage });



app.get('/login',function (req,res) {
    res.render("login.ejs");
})
app.post('/register',async function (req,res) {
    let user=await usermodel.findOne({email:req.body.email});
    if(user){res.status(404).send("User Already exsist")}
    else{bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, async function(err, hash) {
            // Store hash in your password DB.
            let createduser= await usermodel.create({
                email:req.body.email,
                username:req.body.username,
                password:hash,
        
            })
            let token=jwt.sign({email:req.body.email,userId:createduser._id},"shhhhh");
            res.cookie("token",token);
            // res.send("registered");

            res.render("home",{user});
        });
    });}
})
app.post('/login',async function (req,res) {
    let user=await usermodel.findOne({username:req.body.username});
    console.log(user);
    if(user==null){res.send('something went wrong');}
    else{
        bcrypt.compare(req.body.password,user.password,function(err,result){
             if(result){
               let token =jwt.sign({email:user.email,userid:user._id},'ssssssg');
               res.cookie('token',token);
                
                res.render("home",{user});}
             else{
                res.send("Incorrect Password")
             }
        })
    }
})
app.get("/logout", async function (req, res) {
    
    res.cookie("token","");
    res.redirect("/login");
})
app.get('/register',function (req,res) {
    res.render("register.ejs");
})
app.get('/home',isloggedIn,function (req,res) {
    res.render("home.ejs");
})
app.get('/index',function (req,res) {
    res.render("index.ejs");
})
app.get('/order',function (req,res) {
    res.render("order.ejs");
})

app.post("/createorder",async function(req,res){
    //  upload.single('pdf'),
     try {
        let user=await usermodel.findOne({email:req.body.email})
        console.log(user);
        // Create a new order after the PDF is uploaded
        const order = await Order.create({
            Name: req.body.Name,
            Contact_Number:req.body.Contact_Number,
            Email: req.body.Email,
            Preferred_Time_Slot:req.body.Preferred_Time_Slot,
            Select_Service:req.body.Select_Service,
            Number_of_Copies:req.body.Select_Service,
            Paper_Size:req.body.Paper_Size,
            user:user._id
        });
        user.printing_file.push(order._id);

        await order.save();              // Save the order in the database
        // res.redirect("Home");

        res.status(201).send({
            message: 'Order created successfully',
            order: order
        });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
    
})
function isloggedIn(req, res, next) {
    const token = req.cookies.token; // changed from 'Token' to 'token'
    if (!token || token === "") {
        return res.redirect("/login");
    }
    
    try {
        let data = jwt.verify(token, "shhhhh");
        req.user = data;
        next();
    } catch (err) {
        console.log(err);
        res.redirect("/login");
    }
}


app.listen(3000);
