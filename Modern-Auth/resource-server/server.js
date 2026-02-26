const express = require("express");
const apiRoutes = require("./src/routes/apiRoutes");
const config = require("./src/config");
const cors = require("cors");
const app = express();

// CORS middleware should be at the top, before any routes. Otherwise, preflight (OPTIONS) requests will not get handled correctly.
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "OPTIONS"],
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
