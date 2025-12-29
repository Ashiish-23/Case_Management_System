const jwt = require("jsonwebtoken");

module.exports = (req,res,next)=>{
  const header = req.headers.authorization;
  if(!header) return res.sendStatus(401);

  const token = header.split(" ")[1];

  try{
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch{
    res.sendStatus(403);
  }
};
