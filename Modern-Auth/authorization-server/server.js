const express = require("express");
const bodyParser = require("express").urlencoded({ extended: true });
const path = require("path");
const oauthRoutes = require("./src/routes/oauthRoutes");
const config = require("./src/config");
const cors = require('cors');
const app = express();

app.use(bodyParser);
app.use(cors({
    origin: 'http://localhost:3000', // This will only allow our client app for resource sharing at different origins
    methods: ['GET', 'POST'],
    credentials: true
}));


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