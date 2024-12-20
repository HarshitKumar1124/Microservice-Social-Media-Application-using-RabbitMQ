const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

    converseID:{
        type:mongoose.Schema.ObjectId,
        ref:'conversations'
    },
    sender:{
        type:mongoose.Schema.ObjectId,
        ref:'users'
    },
    receiver:{
        type:mongoose.Schema.ObjectId,
        ref:'users'
    },
    content:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model("messages",messageSchema);