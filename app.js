const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const _ = require("lodash");

//CREATE MONGOOSE DB
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/locustDB", {useNewUrlParser: true, useUnifiedTopology: true});

const articleSchema = new mongoose.Schema({
  title: String,
  date: Date,
  author: String,
  content: String,
  img: { data: Buffer, contentType: String }
});

const Article = mongoose.model("Article", articleSchema);

const testArticle = new Article({
  title: "Test Article Title",
  date: "May 30, 2020",
  author: "Olivia O'Dwyer",
  content: "This is the test article content blah blah blah",
});

// testArticle.save();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  Article.find(function(err, articles) {
    if (err) {
      console.log("error");
    } else {
      res.render("home", {
        articles: articles
        });
    }
  });
});

app.get("/articles/:articleID", function(req, res){
  const requestedID = req.params.articleID;

  Article.findOne({_id: requestedID}, function(err, article) {
    if (!err) {

          res.render("article", {
            title: article.title,
            author: article.author,
            date: article.date,
            content: article.content
          });
        }
      });

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
