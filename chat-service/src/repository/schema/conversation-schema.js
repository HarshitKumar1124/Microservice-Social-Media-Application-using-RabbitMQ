const mongoose = require('mongoose');

const converseSchema = new mongoose.Schema({

    participants: [
        {
            type:String,
            ref:'users'
        }
    ],
    lastConverse:{
        sender:{
            type:String
        },
        message:{
            type:String
        }
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model("conversations",converseSchema);