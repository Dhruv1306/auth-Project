I had added the styling to every section of the app. 

********************************

I had also added the `Registration flow`to the app. 


->->-> check the `./References/Images/image.png` file for more information on the Registration flow.

*****************


Also, added, strong Authentication & Authorization flow to the app. (This is similar to our `Basic App` but with more features).

For instance, that `URL manipulation`, that I had tackled in the `Basic App` is now handled in a more robust way in this one. 

->->-> check the `./References/Images/image2.png` file for more information on the Authentication flow.


************************

Complete step-by-step flow of how a new user's data gets stored in MySQL:

->->-> go to the `./References/Images` folder:

-> image3.png
-> image4.png
-> image5.png
-> image6.png  :- And the SQL query inserts a new row into the users table.
-> image7.png
-> image8.png
-> image9.png

***************************************

`NOW LET'S START WITH THE GOOGLE AUTHENTICATION`

For this, we first need to create a project on the Google Cloud Console and enable the Google Sign-In API and get our `Client ID` and `Client Secret`.


NOTE: For field "Authorized JavaScript origins" : we will put `http://localhost:3010`
and, our authorized redirect URI will be `http://localhost:3010/auth/google/callback`


Step 2: we'll store Google Credentials in our authorizartion server's ".env" file.


`GOOGLE_CLIENT_ID=your-client-id-here`
`GOOGLE_CLIENT_SECRET=your-client-secret-here`


and install some dependensied in authorization server:

`npm install googleapis passport passport-google-oauth20`


`passport — Authentication middleware`
`passport-google-oauth20 — Google OAuth 2.0 strategy`
`express-session — To temporarily store OAuth params during Google redirect`



Step 3: Now, we nees to start with `Adding Google credentials inside the "config/index.js"` file.

Step 4: Need to add `session` middleware & `passport` initialization in `server.js` file.

Step 5:  NOTE: we aneed to config our `passport` strategy in `src/config/passport.js` file.   (Also, called Google strategy).


Step 6: Now, we can add Google OAuth routes in `authorization-server/src/routes/oauthRoutes.js` file.

Step 7: We also, need to handle the callback from Google in `authController.js` file. (This is the route where Google sends the user back after successful authentication).

Step 8: Now, we only left with one thing, and that is to add the `Sign in with Google` button in our `login.ejs` file and `Sign up with Google` button in our `register.ejs` file.


********************

Hope it works!!!

(Also, one tip: if a port is already in use, then use `npx kill-port <port-number>` to kill the process.)

.
.
.
.
.
.
... it didn't worked properly. 

No worries, let's solve the errors...

Yeah, understand it now...
    `When Google redirects back, our Passport regenerates the session, which destroys the "oauthParams" we stored`. 
    `So, we need to pass the OAuth params through Google's "state" parameter instead of relying on the session. By encoding that OAuth params as "Base64 JSON" & pass it as "state" to Google.`


🐛 The Bug:

    When you click "Sign in with Google":

    We stored OAuth params in req.session.oauthParams
    User goes to Google → authenticates
    Google redirects back to /auth/google/callback
    Passport regenerates the session (security feature) → oauthParams is destroyed 💥

    handleGoogleCallback reads "req.session.oauthParams" → null → error


✅ The Fix:

    1. Encode OAuth params as Base64 JSON
    2. Pass as Google "state" parameter
    3. Google sends the "state" back to our callback URL (unchanged)
    4. Now, we can decode it in our "handleGoogleCallback" & get our "oauthParams" back.
    5. No session dependency!   



Yayyy!!! 🎉🎉 now we are talking!!!

Also, an important Functionality came into my mind and I had implemented it, named as `Danger Zone`. So it is about deleting an existing user so if you want to delete your account you can also delete it and all of your data will also get deleted from our Database. So its a very useful functionality like if someone is just testing it or just playing around with the app and now they want to delete their account, now they can delete it by entering the Danger Zone and then can make a new user account with that same id. 😊

can also check "image10.png" for the flow on the delete account functionality.


And I've also enhanced the UI✨💖 like those beautiful toast notifications and many more💖💖💖