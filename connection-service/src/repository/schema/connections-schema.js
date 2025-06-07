const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    userID: {
        type:String,
        required:true,
        unique:true
    },
    following: {
        type:Map,
        of:String,
        default: () => new Map()
        
    },
    followers: {
        type:Map,
        of:String,
        default: () => new Map()
    },
    requests: {
        incoming:{
            type:Map,
            of:String,
            default: () => new Map()
        },
        outgoing:{
            type:Map,
            of:String,
            default: () => new Map()
        }
    },
    blocked: {
        type:Map,
        of:String,
        default: () => new Map()
    }
});

module.exports = mongoose.model("connect",connectionSchema);