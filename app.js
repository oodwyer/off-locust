const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");

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

// const videoSchema = new mongoose.Schema({
//   title: String,
//   subtitle: String,
//   date: Date,
//   author: String,
//   content: String,
//   url: String,
//   dateString:String
// });
// const Video = mongoose.model("Video", videoSchema);

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const app = express();
var topItems = [[1,"Sample item 1"],[2,"Sample item 2"],[3,"Sample item 3"],[4,"Sample item 4"],[5,"Sample item 5"]]

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
  res.render("videos");
});

app.get("/author/:authorName", function(req, res) {
  const requestedAuthor = req.params.authorName;

  Article.find({author: requestedAuthor}).sort([['date', 1]]).exec(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("author", {
        authorName: _.toUpper(requestedAuthor),
        articles: articles
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
                      console.log("error");
                    } else {
                      res.render("compose", {articles:articleArray, questions: questions, topItems:topItems, errM:""});
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
  })

});

app.post("/subscribe-newsletter", function(req,res){
  const pageLink = req.body.pageLink;

});

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
