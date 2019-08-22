const express=require("express");
const router=express.Router();
const express_validator=require("express-validator/check");
const feedController=require("../controllers/feed");
const isAuth=require("../middlware/is-auth");
router.get("/posts",isAuth,feedController.getPosts);
router.post("/createpost",isAuth,
    express_validator.check("title")
    .trim()
    .isLength({min:5}),
    express_validator.check("content")
    .trim()
    .isLength({min:5}),
feedController.createPost);
router.get("/post/:postId",isAuth,feedController.getPost);
router.put("/post/:postId",isAuth,
express_validator.check("title")
    .trim()
    .isLength({min:5}),
    express_validator.check("content")
    .trim()
    .isLength({min:5}),feedController.updatePost);
router.delete("/deletepost/:postId",isAuth,feedController.deletePost);
module.exports=router;