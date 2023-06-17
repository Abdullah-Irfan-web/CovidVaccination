const mongoose=require('mongoose');

const centerschema=new mongoose.Schema({
    centercode:{
        type:String,
        required:true,
    },
    centername:{
        type:String,
        required:true
    },
    centeraddress:{
        type:String,
        required:true,

    },
    centercity:{
        type:String,
        required:true
    },
   
    workinghours:{
        type:String,
        required:true
    },
    candidate:{
        type:Number,
        required:true
    }
})
module.exports=mongoose.model('AllCenter',centerschema);