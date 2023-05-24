const db = require("../models/index.js");
const mysql = require("mysql2");
db.sequelize.sync();
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});



exports.mainScreen = (req,res)=>{
	res.render("index");
	
};
exports.showSignUpPage = (req,res)=>{
	res.render("signup");
};
exports.postedSignUpPage = (req,res)=>{

	const body = req.body;
	const id = body.id;
	const pw = body.password;
	const name = body.name;
	const nickname = body.nickname;
	const phone = body.phone;
	const profile = body.profile_image;

	console.log(nickname, " sign up");

	//need to add checking everything's correct
	 connection.query('select * from members where memberId=?',[id],(err,data)=>{
        if(data.length == 0){
            console.log('register complete');
             connection.query('insert into members(memberId, fullName, nickname, password, phone) values(?,?,?,?,?)',[id, name, nickname, pw, phone]);
 	res.redirect('/signup');
        }else{
            console.log('register failed');
            //res.render('existError');
        }
    });

	res.render("afterSignup",{name: nickname});

};
exports.showLoginPage = (req,res) =>{
	res.render("login");
};
exports.postedLoginPage = (req, res) =>{
	const body = req.body;
	const id = body.id;
	const pw = body.password;

	console.log(id, "just logged in");
	



	//const user = await user.findone({where: id: id});
	//if the id the user put is same to id from DB, save userInfo in user
	//get user's nickname and send nickname to "afterlogin,.ejs"
	res.render("afterLogin");
};
exports.synchronizing = (req,res)=>{
	res.render("sync");
};
exports.getMyInfoPage = (req,res)=>{
	// get the user's info from DB
	// with chapter 10 
	res.send("building this page");	
};
exports.afterAddingPlaylist = (req,res)=>{
	res.render("afterAddingPlaylist");
};
exports.searching = (req,res)=>{
	const body= req.body;
	const subForSearching = body.search;
	console.log("the user's searching for" , subForSearching);
	
	// const nickname = ... using 'chapter10' 
	// find subForSearching in DB 
	// await subForSearching.findAll({ where: { nickname = nickname}});
	// if(error) { };
};
