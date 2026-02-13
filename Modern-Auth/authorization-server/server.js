const express = require("express");
const bodyParser = require("express").urlencoded({ extended: true });
const path = require("path");
const oauthRoutes = require("./src/routes/oauthRoutes");
const config = require("./src/config");

const app = express();
app.use(bodyParser);

// Setup the EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Use OAuth routes
app.use("/", oauthRoutes);

app.listen(config.server.port, () => {
  console.log(
    `Authorization Server running on http://localhost:${config.server.port}`,
  );
});