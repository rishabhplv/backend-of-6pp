const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// register a user

exports.registerUser = catchAsyncErrors(async (req,res,next)=>{
    const{name, email, password} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:"this is a smaple id",
            url:"profilePicUrl"
        }
    })

    sendToken(user, 201, res)
})

// login user 

exports.loginUser = catchAsyncErrors(async (req,res,next)=>{
    const {email, password} = req.body

    // checking if the user has given email and password both 
    if(!email || !password){
        return next(new ErrorHandler("Please Enter Email and Password", 400))
    }

    const user = await User.findOne({email}).select("+password")

    if(!user){
        return next(new ErrorHandler("Invalid Email or Password",401))
    }

    const isPasswordMatched = await user.comparePassword(password)

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email or Password",401))
    }

    sendToken(user, 200, res)

})

// logout user

exports.logout = catchAsyncErrors(async(req,res,next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success:true,
        message:"Logged Out"
    })
})


// forgot password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
  
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
  
    // Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();
  
    await user.save({ validateBeforeSave: false });
  
    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/user/password/reset/${resetToken}`;
  
    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: `Ecommerce Password Recovery`,
        message,
      });
  
      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
  
      await user.save({ validateBeforeSave: false });
  
      return next(new ErrorHandler(error.message, 500));
    }
  });


  // reset password

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

  // creating token hash
     const resetPasswordToken = crypto
     .createHash("sha256")
     .update(req.params.token)
     .digest("hex")

     const user  = await User.findOne({
      resetPasswordToken ,
      resetPasswordExpire:{$gt: Date.now()}
     })

     if(!user){
      return next(new ErrorHandler("Reset password token is invalid or has been expired",400))
     }

     if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password does not match with confirmPassword", 400));
    }

     user.password = req.body.password
     user.resetPasswordToken= undefined
     user.resetPasswordExpire= undefined

     await user.save()

     sendToken(user, 200, res)
})


//get user detail
exports.getUserDetails = catchAsyncErrors(async (req,res,next)=>{
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success:true,
    user
  })
})

// Update user password
exports.updatePassword =  catchAsyncErrors(async(req,res,next)=>{
  const user = await User.findById(req.user.id).select("+password")
  
  const didPasswordMatch = await user.comparePassword(req.body.oldPassword)
  if(!didPasswordMatch){
    return next(new ErrorHandler("Old password is incorrect",400))
  }

  if(req.body.newPassword !== req.body.confirmPassword){
    return next(new ErrorHandler("Password does not match",400))
  }

  user.password = req.body.newPassword

  await user.save()

  sendToken(user, 200, res)
})


// update user profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email:req.body.email
  }
  // we wil add cloudinary later 

  const user =await User.findByIdAndUpdate(req.user.id, newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false
  })

  res.status(200).json({
    success:true,
    user
  })
});

// get all users-- admin
exports.getAllUsers = catchAsyncErrors(async(req,res,next)=>{
  const users = await User.find()

  res.status(200).json({
    success:true,
    users
  })

})

// get single user -- admin 
exports.getSingleUser = catchAsyncErrors(async(req,res,next)=>{
  const user = await User.findById(req.params.id)

  if(!user){
    return next(new ErrorHandler("User does not exist", 400))
  }

  res.status(200).json({
    success:true,
    user
  })
})


// update user role-- admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email:req.body.email,
    role:req.body.role
  }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false
  })

  if(!user){
    return next(new ErrorHandler(`User does not exist with Id:${req.params.id}`,400))
  }
  res.status(200).json({
    success:true,
    user
  })
});


// delete user -- admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if(!user){
    return next(new ErrorHandler(`User does not exist with Id:${req.params.id}`,400))
  }

  await user.deleteOne()
  res.status(200).json({
    success:true,
    message:"User Deleted Successfully"
  })
});
