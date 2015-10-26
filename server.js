var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");

var app = express();

app.use(express.static("www"));

app.use(session({
    cookie: {
        maxAge: 60 * 1000
    },
    resave: false,
    rolling: true,
    saveUninitialized: true,
    secret: "COOKIE_SECRET"
}));
app.use(bodyParser.json());

app.post("/login", function (req, res, next) {
    console.log(req.session.id);
    var user = req.body.user;
    var pass = req.body.pass;
    if (user === "user" && pass === "pass") {
        req.session.user = "user";
        res.end();
    } else {
        res.status(401).end();
    }
});

app.get("/me", function (req, res, next) {
    console.log(req.session.id);
    if (req.session.user) {
        res.send(req.session.user);
    } else {
        res.status(401).end();
    }
});

var server = app.listen(4000, function () {
  console.log("Sample login server running");
});
