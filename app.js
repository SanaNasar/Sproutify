// app.js

var express = require('express'),
  db = require('./models/index.js'),
  bodyParser = require('body-parser'),
  methodOvrride = require('method-override'),
  passport = require("passport"),
  passportLocal = require("passport-local"),
  cookieParser = require("cookie-parser"),
  cookieSession = require("cookie-session"),
  flash = require("connect-flash"),
  request = require("request"),
  app = express();
  db = require("./models/index");



app.set('view engine', 'ejs');

app.use(methodOvrride());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

var savedList = [];

app.use(cookieSession({
  secret: 'thisismysecretkey',
  name: 'cookie created by Sana',
  //maxage is in milliseconds
  maxage: 360000
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// prepare our serialize function
passport.serializeUser(function(user, done){
  console.log("SERIALIZE JUST RAN");
  done(null, user.id); // when the function is done snatch the userid and save it
});

passport.deserializeUser(function(id, done){
  console.log("DESERIALIZE JUST RAN");
  db.user.find({
    where: {
      id: id
    }
  }).done(function(error, user){
    done(error, user);

  });
});

//Directs to the home page
app.get("/home", function(req, res){
  res.render('home');
});

//Directs to the contacts page
app.get("/contact", function(req, res){
  res.render('contact');
});


//Directs to the foodguide page
app.get("/guide", function(req, res){
  res.render('guide');
});

//Directs to the aroundme page
app.get("/maps", function(req, res){
  res.render('maps');
});

//Directs to the recipe search page
app.get("/recipe", function(req, res){
  res.render('recipe');
});
//Directs to the recipe results page using form action
app.get('/search', function(req, res){
  var query = req.query.searchTerm;
  var url = "http://api.yummly.com/v1/api/recipes?_app_id=45544c9f&_app_key=" + process.env.YUMMLY_API_KEY + "&q=" + query +"&requirePictures=true" ;
  request(url, function (error, response, body) {
    if (!error) {
      var data = JSON.parse(body); //Coverting JSON data into javascript
      console.log(data.matches);
      res.render('results', {recipeList: data.matches || [] });
    }
  });
});

//Directs to the recipe with id
app.get('/search/:id', function(req, res){
  var recipeID = req.params.id;
  var url = "http://api.yummly.com/v1/api/recipe/" + recipeID +"?_app_id=45544c9f&_app_key=" + process.env.YUMMLY_API_KEY + "&requirePictures=true" ;
  request(url, function (error, response, body) {
    if (!error) {
      
      var data = JSON.parse(body);
    console.log(data);

      res.render('info.ejs', {stuff: data || [] });
    }

    });
  });

//Directs to the myfavorites page
// app.get("/myfavorites", function(req, res){
//   // get access to the user
//   // get access to the food
//   // save the food as a favorite of the user
//   res.render('myfav', {savedList: []});
// });



//Directs to the apple page
app.get("/apple", function(req, res){
  res.render('apple');
});
//Directs to the bannana page
app.get("/bannana", function(req, res){
  res.render('bannana');
});
//Directs to the apple page
app.get("/blackberry", function(req, res){
  res.render('blackberry');
});

//Directs to the new post page
app.get("/blog", function(req, res){
  console.log(req.user);
  res.render('blog');
});

app.post("/blog", function(req, res){
  //params (name, title, content, etc) req.param("key")
  // save to db 
  // render view (show post #id) /blog/:id
   if(req.user){
    db.post.create(req.body.post).success(function (newPost) {
        req.user.addPost(newPost);
        res.redirect("/posts");
    });
   } else {
      res.redirect("/blog");
   }
  console.log(req.param);
});

app.get("/posts", function(req, res){
  console.log(req.user);
  if(req.user){
    db.post.findAll().error(function(){
      console.log("OOPS SOMETHING WENT WRONG!");
    })
    .success(function(posts){
       res.render('index', {posts: posts});
    });
  } else {
     res.redirect("/login");
  }
});

//Directs to the signup page
app.get('/signup', function(req,res){
  if(!req.user) {
    res.render('signup.ejs', { username: ""});
  }
  else{
    res.redirect('blog');
  }
});
//After signing up
app.get('/submit', function(req,res){
  if(!req.user) {
    res.render('signup.ejs', { username: ""});
  }
  else{
    res.redirect('blog');
  }
});
// on submit, create a new user using form values
app.post('/submit', function(req,res){
  
  db.user.createNewUser(req.body.username, req.body.password,
  function(err){
    res.render('signup', {message: err.message, username: req.body.username});
  },
  function(success){
    res.render('blog', {message: success.message});
  });
});

app.get('/login', function(req,res){
  // check if the user is logged in
  if(!req.user) {
    res.render("login", {message: req.flash('loginMessage'), username: ""});
  }
  else{
    res.redirect('/blog');
  }
});
// authenticate users when logging in - no need for req,res passport does this for us
app.post('/login', passport.authenticate('local', {
  successRedirect: '/posts',
  failureRedirect: '/login',
  failureFlash: true
}));

//logout the user
app.get('/logout', function(req,res){
  //req.logout added by passport - delete the user id/session
  req.logout();
  res.redirect('/');
});


//Directs to the home page or the index page
app.get('/', function(req,res){
  // check if the user is logged in
  if(!req.user) {
    res.render('home');
  }
  else {
    res.render('blog');
  }
});



// catch-all for 404 errors 
app.get('*', function(req,res){
  res.status(404);
  res.render('404');
});

app.listen(process.env.PORT || 3000, function() {
  console.log("SERVER IS STARTING UP!");
});