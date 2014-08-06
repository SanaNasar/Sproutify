var bcrypt = require("bcrypt");
var salt = bcrypt.genSaltSync(10);
var passport = require("passport");
var passportLocal = require("passport-local");

module.exports = function (sequelize, DataTypes){
   var User = sequelize.define('user', {
     username: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [6, 30],
          }
    },
    password: {
        type:DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      }
    },
    
    
    {
      classMethods: {
        associate: function(db){
          User.hasMany(db.post);
        },
          encryptPass: function(password) {
          var hash = bcrypt.hashSync(password, salt);
          return hash;
        },
          comparePass: function(userpass, dbpass) {
        // don't salt twice when you compare....watch out for this
          return bcrypt.compareSync(userpass, dbpass);
      },
      createNewUser:function(username, password, err, success ) {
        if(password.length < 6) {
          err({message: "Password should be more than six characters"});
        }
        else{
        User.create({
            username: username,
            password: User.encryptPass(password)
          }).error(function(error) {
            console.log(error); // this is the error from the sequelize
            if(error.username){
              err({message: 'Your username should be at least 6 characters long', username: username});
              // this is the error from the createNewUser() function.
            }
            else{
              err({message: 'An account with that username already exists', username: username});
              }
          }).success(function(user) {
            success({message: 'Account created, please log in now'});
          });
        } //close for the else
      } //close for the create new user function

    } //close classMethods outer 

  });// close define user

 passport.use(new passportLocal.Strategy({ // tells the passport js to use passportLocal
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true // its a boolean which use req parameter as a callback
    },
    function(req, username, password, done) { // done is a parameter passed inside as a callback
      // find user in the DB
      // by their username
      User.find({
        where: {
          username: username
        }
      })

      // when that's done.... call .done
      .done(function(error, user){
        if (error) {
          console.log(error);
          return done(err, req.flash('loginMessage', 'Oops! Something went wrong...'));
        }
        if (user=== null) {
          return done(null, false); // null for the DB error and false for the user error.

        }
        if (user === null) {
          return done(null, false, req.flash('loginMessage', 'Username does not exists'));
        }
        if ((User.comparePass(password, user.password)) !== true){
          return done(null, false, req.flash('loginMessage', 'Invalid password'));
        }
        done(null, user); // done is a callback function which checks for the 
                          // serialize function.
      });

    }));

  return User;
}; // close User function