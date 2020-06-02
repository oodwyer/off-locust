const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const _ = require("lodash");

//CREATE MONGOOSE DB
const mongoose = require("mongoose");

//local connection
// mongoose.connect("mongodb://localhost:27017/locustDB", {useNewUrlParser: true, useUnifiedTopology: true});

//mongo db connection
mongoose.connect("mongodb+srv://locust-admin:locust@off-locust-tsemd.mongodb.net/locustDB", {useNewUrlParser: true, useUnifiedTopology: true});

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
          console.log();

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

// app.get("/compose", function(req,res){
//   Article.find(function(err, articles){
//     if(!err){
//       res.render("compose", {articles:articles, fArticles:fArticles, sArticles:sArticles});
//     }
//   })
// });
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

app.listen(3000, function() {
  // console.log("Server started on port 3000");
});
