const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("./index");
const db = require("./database");
const { v4: uuidv4 } = require("uuid");

/*
 * PASSPORT GOOGLE STRATEGY
 * 
 * This sets up how Passport handles Google authentication:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google → user authenticates
 * 3. Google sends back profile data (email, name)
 * 4. We check if user exists in MySQL → if not, create them
 * 5. Return the user object for the rest of the flow
 */

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if user already exists in our database
        const [existingUsers] = await db.query(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );

        if (existingUsers.length > 0) {
          // User exists — use their existing record
          return done(null, existingUsers[0]);
        }

        // User doesn't exist — create a new account (Sign Up with Google)
        const userId = "google-" + uuidv4().split("-")[0];
        const googlePassword = "GOOGLE_AUTH_" + uuidv4(); // Placeholder password (user won't use it)

        await db.query(
          "INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)",
          [userId, email, googlePassword, name]
        );

        // Fetch the newly created user
        const [newUsers] = await db.query(
          "SELECT * FROM users WHERE id = ?",
          [userId]
        );

        return done(null, newUsers[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user into session (just store the user id)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (fetch from DB by id)
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    done(null, users[0] || null);
  } catch (error) {
    done(error, null);
  }
});
