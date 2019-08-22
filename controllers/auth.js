const User=require("../models/user");
const exp_validator=require("express-validator/check");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcryptjs");
exports.signup=(req,res,next)=>{
    const email=req.body.email;
    const password=req.body.password;
    const name=req.body.name;
    console.log(email +" " +password + " "+ name)
    const errors=exp_validator.validationResult(req);
    if(!errors.isEmpty()){
        const err=new Error("VALIDATION FAILED");
            err.statusCode=422;
            err.data=errors.array();
            throw err;
    }
    User.findOne({email:email})
    .then(result=>{
        if(result){
            const err=new Error("Email already exists");
            err.statusCode=422;
            throw err;
        }
        bcrypt.hash(password,12)
        .then(hashedPass=>{
            const user=new User({
                name:name,
                password:hashedPass,
                email:email
            });
            return user.save();
        })
        .then(result=>{
            res.status(200).json({
                message:"user created",
                userId:result._id
            });
        })
        .catch(err=>{
            if(!err.statusCode){
                err.statusCode=500;
            }
            next(err);
        });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    });
};
exports.login=(req,res,next)=>{
    const email=req.body.email;
    const password=req.body.password;
    let fetchedUser;
    User.findOne({email:email})
    .then(user=>{
        fetchedUser=user;
        if(!user){
            const error=new Error("User not found");
            error.statusCode=401;
            throw error
        }
        return bcrypt.compare(password,user.password);
    })
    .then(result=>{
        if(!result){
            const error=new Error("wrong password");
            error.statusCode=401;
            throw error
        }
    const token=jwt.sign({emai:fetchedUser.email,
    userId:fetchedUser._id.toString()},"somesupersupersecret",{
        expiresIn:"1h"
    });
    res.status(200).json({
        token:token,
        userId:fetchedUser._id.toString()
    });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=422;
        }
        next();
    });
};