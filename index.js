const port = 4000
const express=require("express");
const app=express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors=require("cors");
const { error } = require("console");

app.use(express.json())
app.use(cors());

mongoose.connect("mongodb+srv://shubham31072002:<password>@cluster0.wp5qtac.mongodb.net/?retryWrites=true&w=majority/e-commerce")


app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

const storage = multer.diskStorage({
    destination:'./upload/images',
    filename:(req,res,cb)=>{
        return cb(null,'${file.fieldname}_${Date.now()}${path.extname(file.originalname)}')
    }
})

const upload=multer({storage:storage})

app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:'http://localhost:${port}/images/${req.file.filename}'
    })
})

const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    Date:{
        type:Date,
        default:Date.now,
    },
    avilable:{
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async (req,res)=>{
    let products =await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id=last_product.id+1;
    }
    else{
        id=1;
    }
    const product=new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
        
    });
    await product.save();
    res.json({
        success:true,
        name:req.body.name,
    })
})

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    res.json({
        success:true,
        name:req.body.name,
    })
})

app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    res.send(products);
})


const User = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

app.post('/signup',async (req,res)=>{
    let check = await User.findOne({email:req.body.email});
    if(check)
    {
        return res.status(400).json({success:false,errors:"existing mail"})
    }
    let cart={};
    for (let i=0; i<300; i++)
    {
        cart[i]=0;
    }
    const user = new User({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data ={
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})


app.post('/login',async(req,res)=>{
    let user = await User.findOne({email:req.body.email});
    if(user)
    {
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else
        {
            res.json({success:false,error:"Wrong password"});
        }
    }
    else
    {
        res.json({success:false,error:"wrong email id"});
    }
})

app.get('/newcollections',async(req,res)=>{
    let products=await Product.find({});
    let newcollections=products.slice(1).slice(-8);
    res.send(newcollections);
})

const fetchUser=async(req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else
    {
        try{
            const data=jwt.verify(token,'secret_ecom');
            req.user=data.user;
            next();
        }
        catch(error)
        {
            res.status(401).send({errors:"please authenticate using a valid token"})
        }
    }
}
app.post('/addtocart',fetchUser,async (req,res)=>{
    let userData=await User.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await User.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    
})

app.post('/removefromcart',fetchUser,async (req,res)=>{
    let userData=await User.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await User.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    
})

app.post('./getcart',fetchUser, async (req,res)=>{
    let userData=await User.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error)
    {
        console.log("Server running on port "+port)
    }
    else{
        console.log("Error "+error)
    }
})