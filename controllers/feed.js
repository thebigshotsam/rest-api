const path=require("path").join(__dirname,"../","images","image.jpg");
const express_validator=require("express-validator/check");
const Post=require("../models/post");
const User=require("../models/user");
const io=require("../socket");
const fs=require("fs");
exports.getPosts=(req,res,next)=>{
    const page=req.query.page || 1; 
    let totalItems;
    Post.find()
    .countDocuments()
    .then(count=>{
        totalItems=count;
        console.log(totalItems);
   })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            }
            next(err); 
    });
   Post.find()
   .populate("creator")
   .sort({createdAt:-1})
   .skip((page-1)*2)
   .limit(2)
    .then((posts)=>{
        res.status(200).json({
            message:"Posts fetched Successfully",
            posts:posts,
            totalItems:totalItems
        });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            }
            next(err); 
    });
      
};
exports.createPost=(req,res,next)=>{
    const title=req.body.title;
    const content=req.body.content;
    const errors=express_validator.validationResult(req);
    if(!errors.isEmpty()){
        const err=new Error("Validation failed, entered data is incorrect.");
        err.statusCode=422;
        throw err;
    }
    if(!req.file){
        const err=new Error("No file found");
        err.statusCode=422;
        throw err;
    }
    let imageUrl=req.file.path;
    imageUrl=imageUrl.replace("\\","/");
    const post=new Post({
        title:title,
        content:content,    
        imageUrl:imageUrl,
        creator:req.userId
    });
    let fetchedUser;
    post.save()
    .then(result=>{
        User.findById(req.userId)
        .then(user=>{
            fetchedUser=user;
            user.posts.push(result);
            return user.save();
        })
        .then(()=>{
            io.getIo().emit("posts",{
                action:"create",
                post:post
            });
            res.status(201).json({
            message:"Created successfully",
            post:{...result,creator:{
                _id:fetchedUser._id,
                name:fetchedUser.name
                }
            },
            creator:{
                _id:fetchedUser._id,
                name:fetchedUser.name
            }
        })
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
exports.getPost=(req,res,next)=>{
    const postId=req.params.postId; 
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const err=new Error("Could not find Post.");
            err.statusCode=404;
            throw err; 
        }
        res.status(200).json({
            message:"post fetched",
            post:post   
        });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    });
};
exports.updatePost=(req,res,next)=>{
    const postId=req.params.postId
    const title=req.body.title;
    const content=req.body.content;
    let imageUrl=req.body.image;
    const errors=express_validator.validationResult(req);
    if(!errors.isEmpty()){
        const err=new Error("Validation failed, entered data is incorrect.");
        err.statusCode=422;
        throw err;
    }
    if(req.file){
        imageUrl=req.file.path;
        imageUrl=imageUrl.replace("\\","/");
    }
    // else{
    //     const err=new Error("No file selected");
    //     err.statusCode=422;
    //     throw err;
    // }
    Post.findById(postId)
    .then(post=>{
        if(!post){
        const err=new Error("No file selected");
        err.statusCode=422;
        throw err;
    }
    if(post.creator._id.toString() !== req.userId.toString()){
        const err=new Error("Not Authorized");
        err.statusCode=403;
        throw err;
    }
     if(imageUrl !== post.imageUrl){
         fs.unlink(post.imageUrl,err=>console.log(err)); 
     }   
        post.title=title;
        post.content=content;
        post.imageUrl=imageUrl;
        return post.save();
    })
    .then((result)=>{
        io.getIo().emit("posts",{
            action:"update",
            post:result
        });
        res.status(200).json({
            message:"Post updated",
            post:result
        });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    });
};
exports.deletePost=(req,res,next)=>{
    const postId=req.params.postId;
    console.log(postId);
    Post.findById(postId)
    .then(post=>{
        if(post.creator.toString() !== req.userId.toString()){
            const err=new Error("Not Authorized");
            err.statusCode=403;
            throw err;
        }
        fs.unlink(post.imageUrl,err=>console.log(err));
        return User.findOne({_id:req.userId})
        .then(user=>{
            user.posts=user.posts.filter(i=>{
                return i._id.toString() !== postId
            });
            return user.save();
        })
        .catch(err=>{
            if(!err.statusCode){
                err.statusCode=500;
            }
            next(err);
        });
    })
    .then(()=>{
        return Post.findByIdAndRemove(postId);
    })
    .then(()=>{
        io.getIo().emit("posts",
        {
            action:"delete",
            post:postId
        });
        res.status(200).json({
            message:"Deleted successfully"
        });
    })
    .catch((err)=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    });
};