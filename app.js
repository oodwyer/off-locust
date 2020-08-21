const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const https = require("https");

//Encryption stuff, saltRounds can be increased if more security is needed
const bcrypt = require("bcrypt");
const saltRounds = 10;

//CREATE MONGOOSE DB
const mongoose = require("mongoose");

//local connection
// mongoose.connect("mongodb://localhost:27017/locustDB", {useNewUrlParser: true, useUnifiedTopology: true});

//mongo db connection
mongoose.connect("mongodb+srv://locust-admin:locust@off-locust-tsemd.mongodb.net/locustDB", {useNewUrlParser: true, useUnifiedTopology: true});

//Model for users, currently has just the one admin user
const userSchema = new mongoose.Schema({
  username:String,
  password:String
});
const User = mongoose.model("User", userSchema);

const articleSchema = new mongoose.Schema({
  title: String,
  subtitle:String,
  date: Date,
  author: String,
  content: String,
  section: String,
  featured: Boolean,
  img: String,
  dateString:String
});
const Article = mongoose.model("Article", articleSchema);

const questionSchema = new mongoose.Schema({
  content: String
});
const Question = mongoose.model("Question", questionSchema);

const videoSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  date: Date,
  author: String,
  url: String,
  urlEnd:String,
  dateString:String,
  img:String
});
const Video = mongoose.model("Video", videoSchema);

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const app = express();
var topItems = [[1,"Fulfilling your civic duty and {{registering_to_vote_in_PA,https://www.pavoterservices.pa.gov/Pages/VoterRegistrationApplication.aspx}}"],[2,"Blasting Miley’s latest banger {{“Midnight_Sky”,https://www.youtube.com/watch?v=aS1no1myeTM}}"],[3,"Eye glitter and vibrant colored eyeshadows to fulfill your Euphoria fantasy"],[4,"Dorm gardens because deep down we’re all a little {{cottagecore,https://en.wikipedia.org/wiki/Cottagecore}}"],[5,"{{Magic_Spoon_cereal,https://magicspoon.com}} for health nuts looking to satisfy their sweet tooth"]]

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



app.get("/login", function(req, res){
  res.render("login", {errorMess:""});
});

app.get("/", function(req, res) {
  Article.find({featured:true}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("home", {
        articles: articles
      });
    }
  });
});

app.get("/exposed", function(req, res) {
  Article.find({section: "exposed"}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("exposed", {
        articles: articles
        });
    }
  });
});

app.get("/confessionals", function(req, res) {
  Article.find({section: "confessionals"}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("confessionals", {
        articles: articles
        });
    }
  });
});

app.get("/avant-garde", function(req, res) {
  Article.find({section: "avant-garde"}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("avant-garde", {
        articles: articles,
        topItems:topItems
        });
    }
  });
});

app.get("/after-hours", function(req, res) {
  Article.find({section: "after-hours"}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("after-hours", {
        articles: articles
        });
    }
  });
});

app.get("/ask-off-locust", function(req, res) {
  Article.find({section: "ask-off-locust"}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("ask-off-locust", {
        articles: articles
        });
    }
  });
});

app.get("/videos", function(req, res) {
  Video.find(function(err, videos){
    if(err){
      console.log(err);
    } else {
      res.render("videos", {videos:videos});
    }
  })
});

app.get("/author/:authorName", function(req, res) {
  const requestedAuthor = req.params.authorName;
  var arr = requestedAuthor.split(" ");
  var authorLink = "";
  arr.forEach(function(w) {
    authorLink += w + "%20";
  });
  authorLink = authorLink.substring(0, authorLink.length - 3);

  Article.find({author: requestedAuthor}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log(err);
    } else {
      Video.find({author: requestedAuthor}).sort([['date', 1]]).exec(function(err, videos) {
        if (err) {
          console.log(err);
        } else {
          res.render("author", {
            authorName: _.toUpper(requestedAuthor),
            articles: articles,
            authorLink: authorLink,
            videos:videos
          });
        }
      });
    }
  });

});


app.get("/articles/:articleID", function(req, res){
  const requestedID = req.params.articleID;

  Article.findOne({_id: requestedID}, function(err, article) {
    if (!err) {
          // adds the hashtag for the exposed section
          let curSection = article.section;
          curSection == "exposed" ? curSection = "#exposed" : null
          curSection == "after-hours" ? curSection = "after hours" : null
          curSection == "ask-off-locust" ? curSection = "ask off locust" : null

          res.render("article", {
            article:article,
            sectionAp:_.toUpper(curSection),
            articleID:  requestedID
          });
        }
      });

});

app.get("/videos/:videoID", function(req, res){
  const requestedID = req.params.videoID;

  Video.findOne({_id: requestedID}, function(err, video) {
    if (!err) {
          res.render("video", {
            video:video,
            videoID:  requestedID
          });
        }
      });

});

app.post("/question", function(req, res) {
  //create new question object
  const question = new Question({
      content: req.body.qBody
    });

  //save to db
  question.save(function(err){
    if (err) {
      console.log("error");
    } else {
      res.redirect("/ask-off-locust");
    }
  });

});

app.post("/login", function(req, res){
var articleArray;

  const enteredPassword = req.body.password;
  //looks for user with matching username
  User.findOne({username:req.body.username}, function(err, foundUser){
    if(err){
      console.log(err);
      res.render("login", {errorMess:"An error occured. Please try again."});
    } else {
      if(foundUser){ //username entered is valid

        //checks if the password is correct:
        bcrypt.compare(enteredPassword, foundUser.password, function(err, result){
          if(err){
            console.log(err);
            res.render("login", {errorMess:"An error occured. Please try again."});
          } else {
            if(result){ //password was correct: successful authentication!

              Article.find(function(err,articles){
                if(err){
                  console.log(err);
                } else {
                  articleArray = articles;

                  Question.find(function(err, questions) {
                    if (err) {
                      console.log(err);
                    } else {
                      Video.find(function(err,videos){
                        if(err){
                          console.log(err);
                        } else {
                          res.render("compose", {articles:articleArray, questions: questions, videos:videos, topItems:topItems, errM:""});
                        }
                      });
                    }
                  });

                }
              });
            } else { //password was incorrect
              res.render("login", {errorMess:"Incorrect username or password. Please try again."});
            }
          }
        });
      } else { //username doesn't match an existing user
        res.render("login", {errorMess:"Incorrect username or password. Please try again."});
      }
    }
  })
});

app.post("/reset-password", function(req, res){
const username = req.body.username;
const oldPassword = req.body.oldPassword;
const newPassword = req.body.newPassword;
const newPassword2 = req.body.newPassword2;

  User.findOne({username:username}, function(err, foundUser){ //looks for matching username
    if(err){
      console.log(err);
      res.render("login", {errorMess:"An error occured when resetting. Please try again."});
    } else {
      if(foundUser){ //username entered is valid

        //checks if the password is correct:
        bcrypt.compare(oldPassword, foundUser.password, function(err,result){
          if(err){
            console.log(err);
            res.render("login", {errorMess:"An error occured when resetting. Please try again."});
          } else {
            if(result){ //password was correct
                if(newPassword === newPassword2){ //checks if 2 new passwords match

                  //encrypts the new password to store in DB
                  bcrypt.hash(newPassword, saltRounds, function(err, hashResult){
                    if(err){
                      console.log(err);
                    } else{ //updates the user's password
                      User.updateOne({username:username},{password:hashResult}, function(err){
                        if(err){
                          console.log(err);
                        } else{
                          res.render("login", {errorMess: "Successfully updated password!"})
                        }
                      });
                    }
                  });
                } else { //two new passwords didn't match each other
                  res.render("login", {errorMess:"Passwords did not match. Please try again."});
                }
            } else { //password was incorrect
              res.render("login", {errorMess:"Incorrect username or password. Please try again."});
            }
          }
        })
      } else { //username doesn't match an existing user
        res.render("login", {errorMess:"Incorrect username or password. Please try again."});
      }
    }
  });
});

app.post("/compose-article", function(req,res,){
  let title= req.body.title;
  let author= req.body.author;
  let section= req.body.section;
  let featured= req.body.featured === "on" ? true : false;
  let content= req.body.content;
  let subtitle = req.body.subtitle;
  let image = req.body.image;
  let d = req.body.date;
  var date = new Date(d);
  const newArticle = new Article ({
    title:title,
    subtitle:subtitle,
    author:author,
    section:section,
    featured:featured,
    content:content,
    img: image,
    date:date,
    dateString: months[date.getMonth()]+" "+(date.getDate())+", "+ date.getFullYear()
  });

  newArticle.save(function(err){
    err ? console.log(err) : null
  });

  res.redirect("/");
});

app.post("/compose-featured", function(req,res){
  Article.find(function(err,articles){
    if(err){
      console.log(err);
    } else {
      articles.forEach(function(article){
        let checkbox = req.body[article._id];
        if(checkbox){ //if this article is checked
          Article.updateOne({_id:article._id}, {featured:true}, function(err){
            err ? console.log(err) : null;
          });
        } else {
          Article.updateOne({_id:article._id}, {featured:false}, function(err){
            err ? console.log(err) : null;
          });
        }
      })
    }
  });
  res.redirect("/");
});

app.post("/compose-delete", function(req,res) {
  Article.find(function(err,articles){
    if(err){
      console.log(err);
    } else {
      articles.forEach(function(article){
        let checkbox = req.body[article._id];
        if(checkbox){ //if this article is checked
          Article.deleteOne({_id:article._id}, function(err){
            err ? console.log(err) : null;
          });
        }
        })
    }
  });
  res.redirect("/");
});

app.post("/compose-edit", function(req,res){
  const articleId = req.body.articleId;
  Article.findOne({_id:articleId}, function(err, article){
    if(err){
      console.log(err);
    } else{
      let curSection = article.section;
      let inputDate= "";
      if(article.date){
        let m = article.date.getMonth()+1;
        let d = article.date.getDate()+1;
        let y = article.date.getFullYear();

        d < 10 ? d = "0"+d : d=d
        m < 10 ? m = "0"+m : m=m
        inputDate = y+"-"+m+"-"+d;

      }

      res.render("edit-article", {article:article, sectionAp: _.startCase(curSection), inputDate:inputDate});
    }

  })
});

app.post("/edit-article", function(req,res){
  let title= req.body.title;
  let subtitle = req.body.subtitle;
  let author= req.body.author;
  let section= req.body.section;
  let content= req.body.content;
  let img = req.body.img;
  let articleId = req.body.articleId;
  let d = req.body.date;
  let date = new Date(d);
  let dateString= months[date.getMonth()]+" "+(1+date.getDate())+", "+ date.getFullYear();
  console.log(req.body);
  Article.updateOne({_id:articleId},{
    title:title,
    subtitle:subtitle,
    author:author,
    section:section,
    content:content,
    img:img,
    date:date,
    dateString:dateString
    },
    function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect("/");//temporary
    }
  });

});
app.post("/new-video", function(req,res){
  const body = req.body;
  let d = req.body.date;
  var date = new Date(d);
  const url = req.body.url;

  var urlEnd = "";
  for (let i = url.length; i>0; i--){
    if(url.charAt(i) == "/"){
      break;
    }
    urlEnd = url.charAt(i).concat(urlEnd);
    // console.log(urlEnd);
  }

  const newVideo = new Video ({
    title: body.title,
    subtitle:body.subtitle,
    author: body.author,
    img:body.img,
    url:url,
    urlEnd: urlEnd,
    date:date,
    dateString: months[date.getMonth()]+" "+(date.getDate())+", "+ date.getFullYear()
  });

  newVideo.save(function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect("/videos")
    }
  })
});

app.post("/select-edit-video", function(req,res){
  const videoID = req.body.videoID;
  Video.findOne({_id:videoID}, function(err, video){
    if(err){
      console.log(err);
    } else{
      let inputDate= "";
      if(video.date){
        let m = video.date.getMonth()+1;
        let d = video.date.getDate()+1;
        let y = video.date.getFullYear();

        d < 10 ? d = "0"+d : d=d
        m < 10 ? m = "0"+m : m=m
        inputDate = y+"-"+m+"-"+d;

      }

      res.render("edit-video", {video:video, inputDate:inputDate});
    }

  })
});

app.post("/edit-video", function(req,res){
  let title= req.body.title;
  let subtitle = req.body.subtitle;
  let author= req.body.author;
  let img = req.body.img;
  let videoID = req.body.videoID;
  let url = req.body.url;
  let d = req.body.date;
  let date = new Date(d);
  let dateString= months[date.getMonth()]+" "+(1+date.getDate())+", "+ date.getFullYear();

  var urlEnd = "";
  for (let i = url.length; i>0; i--){
    if(url.charAt(i) == "/"){
      break;
    }
    urlEnd = url.charAt(i).concat(urlEnd);
    // console.log(urlEnd);
  }

  Video.updateOne({_id:videoID},{
    title:title,
    subtitle:subtitle,
    author:author,
    img:img,
    url:url,
    urlEnd: urlEnd,
    date:date,
    dateString:dateString
    },
    function(err){
      if(err){
        console.log(err);
      } else {
        res.redirect("/");//temporary
      }
  });

});

app.post("/subscribe-newsletter", function(req,res){
  const pageLink = req.body.pageLink;

  var email = req.body.email;

  const data = {
    members: [{
      email_address: email,
      status: "subscribed",
    }]
  }

  const jsonData = JSON.stringify(data);

  const url = "https://us17.api.mailchimp.com/3.0/lists/8c86519328";

  const options = {
    method: "POST",
    auth:"offlocust:76647c8a82052cedd7a99c2c316f6f50-us17"
  }

  const request = https.request(url, options, function(response){
    //send success alert
    if (response.statusCode === 200) {
      res.render("success", {pageLink:pageLink});
    } else {
      res.render("failure", {pageLink:pageLink});
    }

    response.on("data", function(data) {
      console.log(JSON.parse(data));
    })
  })

  request.write(jsonData);
  request.end();

});

//API Key: 76647c8a82052cedd7a99c2c316f6f50-us17
//List ID: 8c86519328

app.post("/top5", function(req,res){
  const items = req.body.items;
  items.forEach(function(item,i){
    topItems[i][1] = item;
  });
  console.log(topItems);
  res.redirect("/avant-garde")
});

//Port setup
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(err) {
  if(err){
    console.log(err);
  } else {
    console.log("Server started");
  }
});
