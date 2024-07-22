const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
 
app.set("view engine",'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.render('index');
})
app.get("/login",(req,res)=>{
    res.render('login');
})
app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})
app.get("/profile", isLoggedIn,(req,res)=>{
    res.send("profile page");
    console.log(req.user);
})

app.post("/create",async (req,res)=>{
    let {email,password,username,name,age} = req.body;
    let user = await userModel.findOne({email});
    if(user)return res.status(500).send("User is already registered!");

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            let user = await userModel.create({
                username,
                name,
                email,
                age,
                password: hash
            })
            let token = jwt.sign({email: email, userid: user._id}, "secretKey");
            res.cookie("token",token);
            res.send("registered.");
        })
    })

})
app.post("/login",async (req,res)=>{
    let {email, password} = req.body;
    let user = await userModel.findOne({email})
    if(!user)return res.status(500).send("something went wrong!");
    
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            let token = jwt.sign({email: email, userid: user._id}, "secretKey");
            res.cookie("token",token);
            return res.status(200).send("logged in successfully!");
        } 
        else res.redirect("/login");
    })

})

// PROTECTED ROUTES
function isLoggedIn(req,res,next){
    if(req.cookies.token === ""){
        res.redirect("/login");
    }    
    else{
        let data = jwt.verify(req.cookies.token,"secretKey");
        req.user = data;
        next();
    }
}

app.listen(3000);