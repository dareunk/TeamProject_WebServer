const port =80,
	express = require("express"),
	app = express(),
	homeController = require("./controllers/homeController");
app.use(express.static("public"));
app.use(homeController.mainScreen);
app.listen(port);
console.log(`Listening on port ${port}`);



