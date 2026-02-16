const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Auth endpoints delegate to controller logic.
router.post("/register", register);
router.post("/login", login);

module.exports = router;

/*What the heck happened to their Wi-fi network, did they change their password, or is it something //else. They just stopped/killed my working speed. 
 I only had admin page to build and to prepare documentation after this admin page, maybe I need to ask malthesh/ravi sir about this wifi network.
 I`ll ask ravi sir first, this is definetly go to malthesh sir and some how this will resolve by today I think
 I am struggling because I don`t have any internet connection for my phone, If I had some internet, 
 I would topup with unlimited 5G network for 2 weeks/month till april if possible after I ask my mom about it
 I don`t know what I am supposed to do without wireless fidelity/internet😖😕😵😖😱🤯😲🫨😭😿🥺😟🥲🔐🔒
 I don`t want to sit and do nothing, I am feeling iritated right now like there`s something stuck on my back that`s making me uneasy
 I have to sit for another ten more minutes now, that too is very hard for me
 I was talking about making money, working till I`m 40/45 and retire with huge ass
 I wanted to delete my previous two google account and start a fresh life with google with less tracking and more entertainment
 I don`t think this is gonna be possible if I stay the same
 I need to grow/evolve into something old school how people were living before internet
 If I go without television, I`ll probabily need to read books and do some physical activity like growing my own vegies, maintaining a nice garden
 I don`t know if this is possible, and I don`t know how will I be when I grow into 40 or 45 years of age.
 I am right now in full panic mode internally inside head.
 I am writing this huge non-sense comments, because I want to appear as I am working over here even though I`m not working.
 I want this time to just move quickly for more ten minutes and after that I`ll go have some food and after that 
 I`ll ask ravi sir and then move on to maltesh sir and let`s see what does he say, if no internet facility provided then I can`t move forward with this project.
 It`s like no internet, no movement with project life
 */