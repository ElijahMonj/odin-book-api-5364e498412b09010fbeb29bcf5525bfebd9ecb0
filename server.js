require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const User = require("./user");

//----------------------------------------- END OF IMPORTS---------------------------------------------------

mongoose.connect(
  process.env.DATABSE_URL,
  {
    useNewUrlParser: true,
    dbName:'odin-book',
    useUnifiedTopology: true,
  },
  () => {
    console.log("Mongoose Is Connected");
  }
);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL, // <-- location of the react app were connecting to
    credentials: true,
  })
);
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

//----------------------------------------- END OF MIDDLEWARE---------------------------------------------------

// Routes
app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.json({message:"Email does not exist."});
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send("Successfully Authenticated");
        console.log("Logged in: "+req.user.email);
      });
    }
  })(req, res, next);
});
app.get('/', checkAuthenticated,async(req,res)=>{

  try {
      const users= await User.find()   
      const response={
          currentUser:req.user,
          users:users
      }
      res.json(response)
  } catch (err) {
      res.status(500).json({message : err.message})
  }
})
//GET ALL USERS


app.post("/register", async (req, res) => {
  
  User.findOne({ email: req.body.email }, async (err, doc) => {
    if (err) throw err;
    if (doc) res.send("User Already Exists");
    if (!doc) {
      let hashedPassword = await bcrypt.hash(req.body.password,10)
      const user=new User({
          firstName:req.body.firstName,
          lastName: req.body.lastName,
          email:req.body.email,
          password: hashedPassword,
          birthDay:req.body.birthDay,
          defaultProfile: "https://lh3.googleusercontent.com/COIa9WcwzEovtQbRpmEJzhAXiyrwvo2T1oqnbGhjRSBI2KXm-6CziGKotKmE4jY58nEgJJm9NeMulNc4aq0a6NyCckauHPwo863HUELD3-SrWsrvmtbDbbUGSr5SfYTd7SODw8dIKtggqmgYEusSGTVU4ztlarsn0eZadU9RNUmv23leKiwEV64z2iChxEASYyjI5TZ1D_WWF5HpIP_PqHpRerNvyO4ZnRInw1FbpsC_gxFyY5KlfMZuAMyj7a6HqGB6MH-yMEp_4twWXe9CM-uasqYP-Jfj-UHweOYQXz3XfC1F87HzGwam5oHN7MsC2iIPybVPAOnfQYHsYy5CzxXWRZ1iJs0eJ35Ra1BhbeU_pTN19_DqSLdKnd2OBG7YLhs267ezGMH4xgn8NBICXbaR1JZ-WBWZN9A80zHkDWYFiucCHYOOaKDkX4I4EGIpAI7IJ7S5Q6pdWe1KwX9N8POhGaxNvQWeBSps5QCrmmeL7oKPW1eOnsDaVZxeQJ26QsmYSGguoPw_CPSw1bjgxvb0ySlNIQ0imWzSkjHrF3flwUx7EaOR01Ucvb5Uah_kxSSVyue4q4Aj7rf_jXlkQbeUvz_YZaagOpM48OUwvT_HYPkjn-avvJNZcwKxLj1uAPjWthJy4UerfcOOKSMIZN7vW9bT-T7l1t7XbrAutaU-8I_r7EmGxQCPUFv6NZO0GJfOLN36YSeQ2rgob5B8GbFW2mLOrfXXy4owwvMFYuJssTZcvXc_t0H20qY7gXbAs_hBBTkqkgk4BugkuywBDc0vBJGWv6AWQAUgPPlc6c3bjuB3ER5KjGVMffuk3dToJYQIziOuURSBs_ytEHa3rcyqF-EUtQL8g-PbRd1UyfPHWUzD1RnSZ6O3ZuUIqjtT65wPB-MSO6wiaxL1vg6NDF8ZiMxjvs89Nq6aYGGDep8zNIeMcoRneqGM0YkbH5IJYojWvVBSMAIM-2a-HYdQ=s898-no?authuser=0",
          bio:"Add Bio",
          friends: [],
          friendRequests:[],
          posts: [],
          notifications:[]
      })
      try {
          const newUser =await user.save()
          res.status(201).json(newUser)
          console.log("Succesfully signed user.:" + newUser)
      } catch (err) {
          res.status(400).json({message: err.message})
      }
    }
  });
});

//register


app.get('/:id',checkAuthenticated,getUser,async(req,res)=>{ 
      if(err){
          res.sendStatus(403) 
      }else{
          res.json(res.user)
      }
})

//GET SPECIFIC USER
app.patch('/addfollowing/:id/:tofollow/',checkAuthenticated,getUser,async(req,res)=>{
   
  if(req.body.tofollow!=null){
      if(res.user.following.includes(req.body.tofollow)){
          console.log("Already following.")        
      }else{
          console.log("Following new user.")
          let currentFollowing=res.user.following
          currentFollowing.push(req.body.tofollow)
          res.user.following=currentFollowing
      }  
      try {
          const updatedUser = await res.user.save()
          res.json(updatedUser)
      } catch (err) {
          res.status(400).json({message: err.message})
      }
  }
})
app.patch('/addfollowers/:id/:followby/',checkAuthenticated,getUser,async(req,res)=>{
   
  if(req.body.followby!=null){
      if(res.user.followers.includes(req.body.followby)){
          console.log("Already following.")        
      }else{
          console.log("Following new user.")
          let currentFollowers=res.user.followers
          currentFollowers.push(req.body.followby)
          res.user.followers=currentFollowers

          const d = new Date();
          const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          let date=month[d.getMonth()]+" "+d.getDate()+" "+d.getFullYear()
          let time=d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })

          const postDate=date+", "+time

          const newNotification ={
              user_id: req.params.followby,
              content: "followed you.",
              date:postDate,
              notificationID:Date.now()
          }
          res.user.notifications.push(newNotification)
      }  
      try {
          const updatedUser = await res.user.save()
          res.json(updatedUser)
      } catch (err) {
          res.status(400).json({message: err.message})
      }
  }
 
})
//FOLLOW
app.patch('/removefollowing/:id/:toremove/',checkAuthenticated,getUser,async(req,res)=>{

  if(req.body.toremove!=null){
      if(res.user.following.includes(req.body.toremove)){
          console.log("Unfollowing "+req.body.toremove)   
          const index = res.user.following.indexOf(req.body.toremove);
          if (index > -1) { 
              res.user.following.splice(index, 1); 
          }
          console.log(res.user.following)
      }else{
          console.log("Already removed.")
      }  
      try {
          const updatedUser = await res.user.save()
          res.json(updatedUser)
      } catch (err) {
          res.status(400).json({message: err.message})
      }
  }

})
app.patch('/removefollowers/:id/:removeby/',checkAuthenticated,getUser,async(req,res)=>{

  if(req.body.removeby!=null){
  
      if(res.user.followers.includes(req.body.removeby)){
          console.log("Removing follower: "+req.body.removeby)   
          const index = res.user.followers.indexOf(req.body.removeby);
          if (index > -1) { 
              res.user.followers.splice(index, 1); 
          }
          console.log(res.user.followers)
      }else{
          console.log("Already removed.")
      }  
      try {
          const updatedUser = await res.user.save()
          res.json(updatedUser)
      } catch (err) {
          res.status(400).json({message: err.message})
      }
  }  
})
//REMOVE FOLLOW
app.get('/:id/posts',checkAuthenticated,getUser,async(req,res)=>{
  if(err){
      res.sendStatus(403) 
  }else{
      res.json(res.user.posts)
  } 
})
//GET ALL POSTS FROM A USER
app.get('/:id/posts/:postIndex',checkAuthenticated,getUser,async(req,res)=>{
  
  if(err){
      res.sendStatus(403) 
  }else{
      let postID=req.params.postIndex
      console.log(postID)
      res.json(res.user.posts[postID])
  }
})
//GET SPECIFIC POST
app.patch('/:id/posts/:postIndex/newComment',checkAuthenticated,getUser,async(req,res)=>{
  
  let postID=req.params.postIndex
  console.log(res.user.posts)
  
  const newComment={
      author_id:req.body.author_id,
      date:req.body.date,
      content:req.body.content,
      comment_id:Date.now() 
  }
  
  let currentPosts=res.user.posts;
  var index = currentPosts.findIndex(item => item.id === +postID)

  currentPosts[index].comments.unshift(newComment)
  console.log(currentPosts[index].comments)
  console.log("---------------------------------")
  console.log(currentPosts)
  
  res.user.posts=currentPosts;

  try {
      res.user.markModified('posts')
      const updatedUser = await res.user.save()
      res.json(updatedUser)
      
  } catch (err) {
      res.status(400).json({message: err.message})
  }
  
})
//WRITE NEW COMMENT


app.patch('/:id',getUser, async (req,res)=>{
  if(req.body.email!=null){
      res.user.email=req.body.email
  }
  if(req.body.password!=null){
      res.user.password=req.body.password
  }

  try {
      const updatedUser = await res.user.save()
      res.json(updatedUser)
  } catch (err) {
      res.status(400).json({message: err.message})
  }
})

app.patch('/:id/bio',checkAuthenticated,getUser, async (req,res)=>{
  if(req.body.bio!=null){
      res.user.bio=req.body.bio
  }
  try {
      const updatedUser = await res.user.save()
      res.json(updatedUser)
  } catch (err) {
      res.status(400).json({message: err.message})
  }
})
//UPDATE USER CREDENTIALS
app.patch('/:id/newPost',checkAuthenticated,getUser, async (req,res)=>{
 
  let newPost;
  if((req.body.picture===null)||req.body.picture===undefined){
      newPost = {
          author: req.body.author,
          date: req.body.date,
          caption: req.body.caption,
          comments: req.body.comments,
          likes: req.body.likes,
          picture: "none",  
          id:Date.now() 
      }
  }else{
      newPost = {
          author: req.body.author,
          date: req.body.date,
          caption: req.body.caption,
          comments: req.body.comments,
          likes: req.body.likes,
          picture: req.body.picture,
          id:Date.now()
      }
  }
  
  
  let currentPosts=res.user.posts;
  currentPosts.unshift(newPost);
  
  
  res.user.posts=currentPosts;

  try {
      const updatedUser = await res.user.save()
      res.json(updatedUser)
  } catch (err) {
      res.status(400).json({message: err.message})
  }
  
})
//ADD POST
app.delete('/:id/posts/:postIndex',checkAuthenticated,getUser, async (req,res)=>{
  
  let postID=req.params.postIndex
  
  console.log(res.user.posts)
  let currentPosts=res.user.posts;
  currentPosts.splice(postID, 1); 
  
  res.user.posts=currentPosts;

  try {
      const updatedUser = await res.user.save()
      res.json(updatedUser)
  } catch (err) {
      res.status(400).json({message: err.message})
  }
})
//DELETE POST
app.delete('/:id',checkAuthenticated,getUser, async(req,res)=>{
 try {
     await res.user.remove()
     res.json({message: 'Deleted User'})
 } catch (error) {
     res.status(500).json({message: err.message})
 }
})
//DELETE USER
app.patch('/:id/changeName',checkAuthenticated,getUser, async(req,res)=>{

    try {
      if(await bcrypt.compare(req.body.password,res.user.password)){

        if(req.body.firstName!=null){
          res.user.firstName=req.body.firstName
        }
        if(req.body.lastName!=null){
          res.user.lastName=req.body.lastName
        }
        //res.user.password=req.body.password
        
        try {
          const updatedUser = await res.user.save()
          res.status(201).json(updatedUser)
        } catch (err) {
          res.status(400).json({message: err.message})
        }

        
      }else{
          console.log("Wrong password.")
          res.status(202).json({message: "Wrong password."})
          
      }
    } catch (error) {
        res.json(error)
    }

 })

 app.patch('/:id/changeEmail',checkAuthenticated,getUser, async(req,res)=>{

  try {
    if(await bcrypt.compare(req.body.password,res.user.password)){

      if(req.body.email!=null){
        User.findOne({ email: req.body.email }, async (err, doc) => {
          if (err) throw err;
          if (doc) res.status(202).json({message: "Email already in use."}); 
          if (!doc) {
            console.log("changeing email...")
            res.user.email=req.body.email;
            try {
              const updatedUser = await res.user.save()
              res.status(201).json(updatedUser)
            } catch (err) {
              res.status(400).json({message: err.message})
            }
          }
        });
             
      }
      //res.user.password=req.body.password

    }else{
        console.log("Wrong password.")
        res.status(202).json({message: "Wrong password."})     
    }
  } catch (error) {
      res.json(error)
  }

})


app.patch('/:id/changePassword',checkAuthenticated,getUser, async(req,res)=>{
  console.log("Current password: " +req.body.password)
  console.log("Current password: " +req.body.newPassword)
  try {
    if(await bcrypt.compare(req.body.password,res.user.password)){


      if(req.body.newPassword!=null){
        let hashedPassword = await bcrypt.hash(req.body.newPassword,10)
        res.user.password=hashedPassword
      }
      
      try {
        const updatedUser = await res.user.save()
        res.status(201).json(updatedUser)
      } catch (err) {
        res.status(400).json({message: err.message})
      }

      
    }else{
        console.log("Wrong password.")
        res.status(202).json({message: "Wrong password."})
    }
  } catch (error) {
      res.json(error)
  }

})































app.post('/logout',(req,res)=>{
    req.logout(function(err) {
      if (err) { return next(err); }
    });
  req.session.destroy(function(err) {
      if (err) { return next(err); }
      
      console.log("Logging out....")
      res.json({username : "Please Login"})
    });

})
async function getUser(req,res,next){
  let user
  try {
      user= await User.findById(req.params.id)
  
      if(user==null){
          return res.status(404).json({message: "Cannot find"})
      }
  } catch (err) {
      return res.status(500).json({message: err.message})
  }

  res.user=user
  next()
}

//----------------------------------------- END OF ROUTES---------------------------------------------------
function checkAuthenticated(req,res,next){
    
  if(req.isAuthenticated()){
      return next()
  }
  res.json({username : "Please Login"})
}
//Start Server
app.listen(4000, () => {
  console.log("Server Has Started");
});
