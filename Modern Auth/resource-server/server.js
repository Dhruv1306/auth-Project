// Resource Server - Protected API
// This is your API that holds protected resources
// Similar to your /dashboard route that requires authentication
// Port: 5000

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

// Import middleware and routes
const apiRoutes = require("./src/routes/api.routes");

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Client app
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    name: "Resource Server",
    status: "running",
    documentation: "Use Bearer token to access /api/* endpoints",
  });
});

// Protected API Routes
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`🛡️  Resource Server running on http://localhost:${PORT}`);
  console.log(
    `📋 Protected endpoints: /api/profile, /api/dashboard, /api/admin`,
  );
});
