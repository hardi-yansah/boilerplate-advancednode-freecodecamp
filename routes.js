const passport = require("passport");
const bcrypt = require("bcrypt");
const GitHubStrategy = require('passport-github').Strategy;
require("dotenv").config();

module.exports = function (app, myDataBase) {
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please log in",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  app.route("/login").post(passport.authenticate("local", { failureRedirect: "/" }), (req, res) => {
    res.redirect("/profile");
  });

  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render("profile", { username: req.user.username });
  });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.route("/register").post((req, res, next) => {
    const hash = bcrypt.hashSync(req.body.password, 12);
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect("/");
      } else {
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              res.redirect("/");
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        );
      }
    });
  },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/profile");
    }
  );

  app.route("/auth/github").get(passport.authenticate("github"));
  app.route("/auth/github/callback").get(passport.authenticate("github", { failureRedirect: "/" }), (req, res) => {
    res.redirect("/profile");
  });

  app.use((req, res, next) => {
    res.status(404)
      .type("text")
      .send("Not Found");
  });
};

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "https://3000-hardiyansah-boilerplate-ayqdbgwglzn.ws-us114.gitpod.io/auth/github/callback"
},
  function (accessToken, refreshToken, profile, done) {
    myDataBase.findOneAndUpdate(
      { id: profile.id },
      {
        $setOnInsert: {
          id: profile.id,
          name: profile.displayName || "John Doe",
          photo: profile.photos[0].value || "",
          email: profile.emails[0].value || "No public email",
          created_on: new Date(),
          provider: profile.provider || ""
        },
        $set: {
          last_login: new Date()
        },
      },
      { upsert: true, new: true },
      (err, doc) => {
        return done(null, doc.value);
      });
  }
));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};