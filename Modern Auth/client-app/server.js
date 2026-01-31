// Client App - Simple Static Server
// This serves your frontend application (like your Basic Auth app, but frontend only)
// Port: 3000

const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/src", express.static(path.join(__dirname, "src")));        // Cause we have defined the css inside the "src" folder

// All routes serve the SPA  (Single Page Application)

// 1 way of defining the route
/* app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
}); */

// 2nd way of defining the route
//app.get('/', (req,res) => { res.sendFile('./public/index.html', {root:__dirname})});

app.get("/callback.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "callback.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile('./public/dashboard.html', {root:__dirname});         // Both the ways will work
});

app.listen(PORT, () => {
  console.log(`💻 Client App running on http://localhost:${PORT}`);
  console.log(`📋 Open http://localhost:${PORT} to start OAuth flow`);
});


/* NOTE : 
  - We aren't gonna use any of the way to explicitly define a route for '/'. Cause Express will automatically serve `index.html` when someone visits `/` route.

  - Writing "app.use("/src", express.static(path.join(__dirname, "src")));", instead of "app.use(express.static(path.join(__dirname, "src")));".....

    - It's about how we reference files in our HTML:
      - Using this prefix "/src", HTML link would be like this  ->  <link href="/src/css/style.css">
      - Without "/src", HTML link would be like this     ->  <link href="/css/style.css">

      I have done this, mainly for clarity and avoiding conflicts. Cause without the prefix, if we had a file called "css/style.css" in both "public" and "src", there would be a conflict & the first "express.static" registered would win.
*/