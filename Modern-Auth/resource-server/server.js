const express = require("express");
const apiRoutes = require("./src/routes/apiRoutes");
const config = require("./src/config");
const cors = require("cors");
const app = express();

// CORS middleware should be at the top, before any routes. Otherwise, preflight (OPTIONS) requests will not get handled correctly.
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api", apiRoutes);

app.listen(config.server.port, () => {
  console.log(
    `Resource Server running on http://localhost:${config.server.port}`,
  );
});
