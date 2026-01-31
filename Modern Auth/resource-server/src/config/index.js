// Resource Server Configuration

module.exports = {
  // Must match Authorization Server's secret
  JWT_SECRET: "your-super-secret-jwt-key-change-in-production",

  // Expected issuer (Authorization Server)
  EXPECTED_ISSUER: "http://localhost:4000",

  // Expected audience
  EXPECTED_AUDIENCE: "resource-server",
};
