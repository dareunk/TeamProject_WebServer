exports.mainScreen = (req,res)=>{
	res.sendFile('./public/index.html',{
		root:'./'
	});
};
