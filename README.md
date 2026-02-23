# Auth Project

This project demonstrates a complete OAuth 2.0 authentication flow using three main components: an Authorization Server, a Client Application, and a Resource Server.

It is designed to showcase secure user authentication, token management, and protected resource access using modern best practices like PKCE and consent screens. The Authorization Server handles user login and token issuance, the Client App initiates authentication and displays user dashboards, and the Resource Server provides protected APIs accessible only with valid tokens.

## How to Run the Project

1. **Install Dependencies**

   - Navigate to each subfolder (`authorization-server`, `client-app`, `resource-server`) and run:
     ```
     npm install
     ```
2. **Start Servers**

   - In each subfolder, start the server:
     ```
     npm start
     ```
   - Or, if `npm start` is not defined, use:
     ```
     node server.js
     ```
3. **Access the Client App**

   - Open your browser and go to the client app’s URL (usually `http://localhost:3000` or as specified in the client-app/server.js).
4. **Test Authentication Flow**

   - Use the client app to log in, grant consent, and access protected resources via the resource server.

## Server Port Numbers

- **authorization-server**: Default port is `3010`
- **client-app**: Default port is `3000`
- **resource-server**: Default port is `3002`

## Predefined Users

The project comes with two predefined users for testing:

| ID | Email            | Password | Name       |
| -- | ---------------- | -------- | ---------- |
| 1  | john@example.com | 123      | John Doe   |
| 2  | jane@example.com | 234      | Jane Smith |

You can use these credentials to log in and test the authentication flow.

## Project Structure

- `authorization-server`: Handles user authentication, consent, and token issuance.
- `client-app`: Initiates OAuth flow, displays login and dashboard pages.
- `resource-server`: Provides protected APIs, validates access tokens.
