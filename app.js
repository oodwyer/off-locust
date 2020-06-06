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
  img: { data: Buffer, contentType: String },
  featured: Boolean
});
const Article = mongoose.model("Article", articleSchema);

const testArticle = new Article({
  title: "Test Article Title 2",
  date: "May 30, 2020",
  author: "Olivia O'Dwyer",
  content: "This is the test article 2 content blah blah blah",
  section: "exposed"
});
// testArticle.save();

const questionSchema = new mongoose.Schema({
  content: String
});
const Question = mongoose.model("Question", questionSchema);

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



app.get("/login", function(req, res){
  res.render("login", {errorMess:""});
});

app.get("/", function(req, res) {
  Article.find({featured:true},function(err, articles) {
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
  Article.find({section: "exposed"}, function(err, articles) {
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
  Article.find({section: "confessionals"}, function(err, articles) {
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
  Article.find({section: "avant-garde"}, function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("avant-garde", {
        articles: articles
        });
    }
  });
});

app.get("/after-hours", function(req, res) {
  Article.find({section: "after-hours"}, function(err, articles) {
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
  Article.find({section: "ask-off-locust"}, function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("ask-off-locust", {
        articles: articles
        });
    }
  });
});

app.get("/author/:authorName", function(req, res) {
  const requestedAuthor = req.params.authorName;

  Article.find({author: requestedAuthor}, function(err, articles) {
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
          if(curSection == "exposed"){
            curSection = "#exposed";
          }

          res.render("article", {
            title:(article.title),
            id: article._id,
            author: article.author,
            date: article.date,
            content: article.content,
            section:_.toUpper(curSection),
            sectionLink: article.section,
            subtitle: article.subtitle
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
                    res.render("compose", {articles:articleArray, errM:""});
                  };
                }
              );
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
  let featured= req.body.featured.checked;
  let content= req.body.content;
  let subtitle = req.body.subtitle;
  // console.log("FEATURED: " + featured);

  const newArticle = new Article ({
    title:title,
    subtitle:subtitle,
    author:author,
    section:section,
    featured:featured,
    content:content
    //date
  });
  newArticle.save(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
});

app.post("/compose-featured", function(req,res){
  Article.find(function(err,articles){
    if(err){
      console.log(err);
    } else {
      articles.forEach(function())
    }
  })
});



app.listen(3000, function() {
  // console.log("Server started on port 3000");
});
