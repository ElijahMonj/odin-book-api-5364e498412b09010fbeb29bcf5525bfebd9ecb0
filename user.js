const mongoose = require("mongoose");

const userSchema=new mongoose.Schema({
    firstName:{
        type: String,
        required:true
    },
    lastName:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    birthDay:{
        type: String,
        required:true
    },
    defaultProfile:{
        type: String,
        required:true
    },
    bio:{
        type: String,
        required:true
    },
    following:{
        type: Array,
    },
    followers:{
        type: Array,
    },
    posts:{
        type: Array,
    },
    notifications:{
        type:Array,
    }

})

module.exports=mongoose.model('User', userSchema)

