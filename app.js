const express =require('express');
const app=express();
const path=require("path");
const fs=require('fs');
const usermodel=require('./models/user.js')
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const cookieparser=require('cookie-parser');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


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
            res.redirect("login");
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
               let token =jwt.sign({email:user.email},'ssssssg');
               res.cookie('token',token);
                
                res.redirect("home");}
             else{
                res.send("Incorrect Password")
             }
        })
    }
})
app.get('/register',function (req,res) {
    res.render("register.ejs");
})
app.get('/home',function (req,res) {
    res.render("home.ejs");
})

app.listen(3000);
