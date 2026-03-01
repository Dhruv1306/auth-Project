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
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:3000',
            'http://localhost:3010',
            'https://modern-auth-server.onrender.com'   // Allow the auth server's own domain for login/register form submissions
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Session middleware — needed to store OAuth params
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

// Health check for UptimeRobot / Keep-alive
app.get("/health", (req, res) => res.status(200).send("OK"));

// Use OAuth routes
app.use("/", oauthRoutes);

// Global Error Handler (Must be after routes)
const errorHandler = require("./src/middleware/errorHandler");
app.use(errorHandler);

app.listen(config.server.port, () => {
  console.log(
    `Authorization Server running on http://localhost:${config.server.port}`,
  );
  
  // Start the database heartbeat to prevent hibernation/sleep
  const { startHeartbeat } = require("./src/services/heartbeatService");
  startHeartbeat(1); // Ping every 1 minute
});