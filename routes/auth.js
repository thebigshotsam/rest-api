const express=require("express");
const router=express.Router();
const express_validator=require("express-validator/check");
const authController=require("../controllers/auth");
router.put("/signup",
express_validator.check("email")
.isEmail()
.withMessage("Please enter a valid email"),
express_validator.check("password")
.trim()
.isLength({min:5}),
// express_validator.check("name")
// .trim()
// .isEmpty(),
authController.signup);
router.post("/login",authController.login);
module.exports=router;