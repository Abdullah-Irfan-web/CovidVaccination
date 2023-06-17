const express=require("express");
const app=express();
const path=require("path");
const bodyparser=require("body-parser");
const mongoose=require('mongoose');
const PORT=process.env.PORT||3000;
const dotenv=require("dotenv");
const shortid=require("shortid");
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy
const bcrypt=require('bcryptjs');
const schedule = require('node-schedule');


const session=require('express-session');
const AllCenter=require('./Models/AllCenter');
const Slot=require('./Models/Slot');

const user=require('./Models/User')

app.set('view engine','ejs');

app.set('views',path.join(__dirname,'views'));
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.json());

dotenv.config({path:'./config.env'})

//  Database Connection
const DB=process.env.DATABASE

mongoose.connect(DB,{
    useNewUrlParser:true,

   
});

const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    console.log("Connected");
});


passport.use(new LocalStrategy({usernameField:'email'},(email,password,done)=>{
    user.findOne({email:email})
    .then(userr=>{
        if(!userr){
            return done(null,false)
        }
        bcrypt.compare(password,userr.password,(err,isMatch)=>{
            if(isMatch){
                return done(null,userr)
            }
            else{
                return done(null,false)
            }
        })
    })
    .catch(err=>{
        console.log(err);
    })
}))


app.use(session({
    secret:"Node",
    resave:true,
    saveUninitialized:true
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.name ,role:user.role});
    });
  });

  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
app.use(passport.initialize());
app.use(passport.session());




function ensureauthentication(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

function ensureadminauthentication(req,res,next){
    if(req.isAuthenticated() && req.user.role==='admin'){
        return next();
    }
    res.redirect('/login');
}

app.get('/',(req,res)=>{
    res.render('register');
})
app.get('/login',(req,res)=>{
    res.render('login');
})
app.get('/searchcenter',ensureauthentication,(req,res)=>{
    res.render('searchcenter')
})

app.get('/bookslot/:id',ensureauthentication,(req,res)=>{
    res.render('bookslot',{centerid:req.params.id})
})
app.get('/myslots',ensureauthentication,(req,res)=>{
    Slot.find({username:req.user.username})
    .then(slot=>{
        res.render('myslot',{slots:slot});
    })
   
})

//logout
app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });

//ADMIN
app.get('/admin',ensureadminauthentication,(req,res)=>{
    AllCenter.find({})
    .then(center=>{
        res.render('admin',{centers:center});
    })
   
});
app.get('/addcenter',ensureadminauthentication,(req,res)=>{
    res.render('addcenter');
    
})

app.get('/admin/del/:id',ensureadminauthentication,(req,res)=>{
    AllCenter.deleteOne({_id:req.params.id})
    .then(success=>{
        res.redirect('/admin');
    })
})




//POST
app.post('/admin/addcenter',ensureadminauthentication,(req,res)=>{
    let center={
        centercode:shortid.generate(),
        centername:req.body.centername,
        centercity:req.body.centercity,
        centeraddress:req.body.centeraddr,
        workinghours:req.body.workinghr
    }
    AllCenter.create(center)
    .then(result=>{
        res.redirect('/admin');
    })
})
app.post('/searchcenter',ensureauthentication,(req,res)=>{
    
    AllCenter.find({$and:[{centercity:req.body.search},{candidate: { $gt: 0 } }]})
    .then(centers=>{
        res.render('searchcenterresult',{centers:centers});
    })
})
app.post('/bookslot',ensureauthentication,async(req,res)=>{
    let centerid=req.body.centerid;
    let centerdetail=await AllCenter.findOne({_id:centerid});
    centerdetail.candidate--;
    centerdetail.save();

   
    let data={
        username:req.user.username,
        firstname:req.body.fname,
        lastname:req.body.lname,
        phone:req.body.phone,
        age:req.body.age,
        date:String(req.body.date),
        slot:req.body.slot,
        dose:req.body.dose,
        center:centerdetail.centercity,
        centername:centerdetail.centername,
        centeraddress:centerdetail.centeraddress

    }
    Slot.create(data)
    .then(slot=>{
        res.render('slotconfirm',{slot:slot});
    })

})
const globalResetJob = schedule.scheduleJob('0 0 * * *', async() => {
    let center=await AllCenter.find();
    center.forEach((cen)=>{
        cen.candidate=10;
        
    })
    center.save();
  })
app.post('/register',(req,res)=>{
    const{name,email,password}=req.body;
    user.findOne({$or:[{name:name},{email:email}]})
    .then(userr=>{
        if(userr){
           
            return res.send("User already Exist !!")
        }

       
        const newuser=new user({
            name:name,
            email:email,
            password:password

        })
        bcrypt.genSalt(10,(err,salt)=>
        bcrypt.hash(newuser.password,salt,(err,hash)=>{
            if(err)
            throw err;
            newuser.password=hash;
           
        newuser.save()
        .then(userr=>{
           
            res.redirect('/login')
        })
        .catch(err=>{
            console.log(err);
        })
        })
        
        )


    })
})
const geturl = (req) => {
    return req.user.role === 'admin' ? '/admin' : 'searchcenter'
}

app.post('/login',
    passport.authenticate('local'),
    function(req, res) {
     
      res.redirect(geturl(req));
    });
  
app.listen(PORT,()=>{
    console.log("Server started");
})