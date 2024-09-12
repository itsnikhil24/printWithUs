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
const uploads= multer({ dest: 'uploads/' })
const  GridFsStorage  = require("multer-gridfs-storage");
const Grid=require('gridfs-stream')
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
const { Readable } = require('stream');

// mongoose.connect('mongodb://localhost:27017/printWithUs', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });

//   const conn = mongoose.connection;
// conn.on('error', console.error.bind(console, 'Connection error:'));
// conn.once('open', () => {
//   console.log('MongoDB connected');
// });








app.set("view engine", "ejs");

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieparser()); // Add this to parse cookies in requests

const mongoURI=`mongodb://localhost:27017/printWithUs`;

MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db("printWithUs");
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log(`Connected to database: ${"printWithUs"}`);
  })
  .catch(err => console.error(err));

  const storage = multer.memoryStorage();
const upload = multer({ storage });
  






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
app.get('/order', (req, res) => {
  res.render('order', { filename: null, pdfname: null }); // Initial rendering with no file uploaded
});

app.post('/upload', upload.single('file_upload'), (req, res) => {
    const readableFileStream = new Readable();
    readableFileStream.push(req.file.buffer);
    readableFileStream.push(null);

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype // Set contentType based on the file's MIME type
    });

    readableFileStream.pipe(uploadStream)
      .on('error', (err) => {
        console.error(err);
        res.status(500).json({ message: 'Error uploading file' });
      })
      .on('finish', () => {
        // Make sure to pass both pdfname and filename
        res.render("order.ejs", {
          pdfname: uploadStream.id || null,  // GridFS file ID or null
          filename: req.file ? req.file.originalname : null // File name or null
        });
      });
});



  app.post('/createorder', async (req, res) => {
    try {
        // Find the user by email
        let user = await usermodel.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).send({ message: "User not found. Enter the same email as of login" });
        }

        // Get file information from the form (hidden fields)
        const pdfFileId = req.body.pdfname;
        const filename = req.body.filename;
        console.log(pdfFileId);

        if (!pdfFileId) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        // Create a new order after the PDF is uploaded
        const order = await Order.create({
            Name: req.body.name,
            Contact_Number: req.body.contact,
            Email: req.body.email,
            Preferred_Time_Slot: req.body.orderTime,
            Select_Service: req.body.service,
            Number_of_Copies: req.body.copies,
            Paper_Size: req.body.paper_size,
            file: {
                _id: pdfFileId, // File ID from GridFS
                filename: filename, 
                contentType: 'application/pdf' // Assuming PDF file
            },
            user: user._id
        });

        // Add the order ID to the user's printing_file array
        user.printing_file.push(order._id);
        await user.save();  // Save user after updating

        // Respond with order details
        res.status(201).render("prevrecord.ejs", { orderdetail: order ,pdfFileId:pdfFileId});
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: err.message });
    }
});


// app.get("/file/:pdfFileId", async (req, res) => {
//     try {
//         const fileId = req.params.pdfFileId;
        
//         // Assuming you are using `gfs` as a GridFS instance
//         const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(fileId) });

//         if (!file) {
//             return res.status(404).send("File not found");
//         }

//         // Check if the file is a PDF (or any specific type)
//         if (file.contentType === 'application/pdf') {
//             // Create a read stream from GridFS and pipe it to the response
//             const readstream = gfs.createReadStream({ _id: file._id });
//             res.set('Content-Type', 'application/pdf');
//             return readstream.pipe(res);
//         } else {
//             return res.status(400).send("Not a PDF file");
//         }

//     } catch (err) {
//         return res.status(500).send({ error: err.message });
//     }
// });




function isloggedIn(req, res, next) {
    const token = req.cookies.token; 
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
