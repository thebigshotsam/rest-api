const express=require("express");
const path=require("path");
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const feedRoutes=require("./routes/feed");
const authRoutes=require("./routes/auth");
const multer=require("multer");
const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"images");
    },
    filename:(req,file,cb)=>{
        console.log(file.originalname);
        cb(null,file.originalname);
    }
});
const fileFilter=(req,file,cb)=>{
    if(file.mimetype==="image/png"||file.mimetype==="image/jpg"||file.mimetype==="image/jpeg"){
        cb(null,true);
    }else{
        cb(null,false);
    }
};
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single("image"));
app.use(bodyParser.json());
app.use("/images",express.static(path.join(__dirname,"images")));
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,DELETE,PATCH,PUT");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    next();
})
app.use(feedRoutes);
app.use("/auth",authRoutes);
app.use((error,req,res,next)=>{
    console.log(error);
    const status=error.statusCode || 500;
    const message=error.message;
    const data=error.data;
    res.status(status).json({message:message,data:data});
});
mongoose.connect("mongodb://localhost:27017/rest",{useNewUrlParser:true})
.then(()=>{
    const server=app.listen(8080);
    const io=require("./socket").init(server);
    io.on("connection",socket=>{
        console.log("Socket Connected");
    });
})
.catch(err=>console.log(err));
