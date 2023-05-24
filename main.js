const port =80,
	express = require("express"),
	app = express(),
	homeController = require("./controllers/homeController");
const ejs = require("ejs");
const layouts = require("express-ejs-layouts");

app.set("view engine","ejs");
app.set("views",__dirname+'/views');
app.use(express.static("public"));
app.use(
	express.urlencoded({
		extended: false
	})
);
app.use(express.json());
app.get("/",homeController.mainScreen);
app.get("/signup",homeController.showSignUpPage);
app.post("/signup",homeController.postedSignUpPage);
app.get("/login",homeController.showLoginPage);
app.post("/login", homeController.postedLoginPage);
app.get("/sync",homeController.synchronizing);
app.get("/myinfo",homeController.getMyInfoPage);
//testing for search function 
app.get("/testing", homeController.afterAddingPlaylist);
app.post("/search", homeController.searching);
app.listen(port);
console.log(`Listening on port ${port}`);



