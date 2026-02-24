const express = require("express");
const bodyParser = require("express").urlencoded({ extended: true });
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const oauthRoutes = require("./src/routes/oauthRoutes");
const config = require("./src/config");
const cors = require('cors');

// Initialize Passport Google Strategy
require("./src/config/passport");

const app = express();

app.use(bodyParser);
app.use(cors({
    origin: 'http://localhost:3000', // This will only allow our client app for resource sharing at different origins
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));

// Session middleware — needed to store OAuth params during Google redirect
app.use(session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,      // Set to true in production with HTTPS
        maxAge: 5 * 60 * 1000  // 5 minutes (just for the OAuth flow)
    }
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Setup the EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Serve static files (CSS, JS, images) from /src
app.use(express.static(path.join(__dirname, "src")));

// Use OAuth routes
app.use("/", oauthRoutes);

app.listen(config.server.port, () => {
  console.log(
    `Authorization Server running on http://localhost:${config.server.port}`,
  );
});