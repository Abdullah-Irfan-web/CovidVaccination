const mongoose=require('mongoose');

const slotschema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
    },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true,

    },
    phone:{
        type:String,
        required:true
    },
   
    age:{
        type:Number,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    slot:{
        type:String,
        required:true
    },
    dose:{
        type:String,
        required:true
    },
    center:{
        type:String,
        required:true
    },
    centeraddress:{
        type:String,
        required:true
    },
    centername:{
        type:String,
        required:true
    }

})
module.exports=mongoose.model('Slot',slotschema);