# Modern Auth - OAuth2.0 + PKCE + OIDC Implementation

## 📁 Folder Structure Overview

```
Modern Auth/
│
├── authorization-server/          # 🔐 OAuth2.0 + OIDC Provider (Port: 4000)
│   │                              # This is like Google/GitHub/Auth0 - issues tokens
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js          # Server configuration (issuer, keys, expiry times)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Handles /authorize endpoint
│   │   │   └── token.controller.js   # Handles /token endpoint
│   │   ├── middleware/
│   │   │   └── auth.middleware.js    # Session & authentication checks
│   │   ├── routes/
│   │   │   └── oauth.routes.js       # All OAuth2.0 routes
│   │   ├── services/
│   │   │   ├── token.service.js      # JWT creation & validation
│   │   │   ├── pkce.service.js       # PKCE verification logic
│   │   │   └── oidc.service.js       # OpenID Connect specifics
│   │   ├── utils/
│   │   │   └── crypto.utils.js       # Hashing, random string generation
│   │   └── views/
│   │       ├── login.html            # Auth server's login page
│   │       └── consent.html          # User consent screen
│   ├── data/
│   │   ├── users.json                # User credentials (like your Basic Auth)
│   │   ├── clients.json              # Registered OAuth clients
│   │   └── codes.json                # Temporary auth codes storage
│   ├── server.js                     # Main entry point
│   └── package.json
│
├── client-app/                    # 💻 Frontend SPA Application (Port: 3000)
│   │                              # This is YOUR application that users interact with
│   ├── public/
│   │   ├── index.html                # Landing page with login button
│   │   ├── callback.html             # Handles OAuth redirect (receives auth code)
│   │   └── dashboard.html            # Protected page (like your Basic Auth dashboard)
│   ├── src/
│   │   ├── js/
│   │   │   ├── pkce.js               # PKCE code_verifier & code_challenge generation
│   │   │   ├── auth.js               # OAuth flow handling
│   │   │   ├── api.js                # API calls to resource server
│   │   │   └── storage.js            # Secure token storage utilities
│   │   └── css/
│   │       └── style.css             # Styling
│   ├── server.js                     # Simple static file server
│   └── package.json
│
├── resource-server/               # 🛡️ Protected API Server (Port: 5000)
│   │                              # This holds your protected resources/data
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js              # API configuration
│   │   ├── controllers/
│   │   │   └── user.controller.js    # User data endpoints
│   │   ├── middleware/
│   │   │   └── token.middleware.js   # JWT validation (replaces your isAuthenticated)
│   │   ├── routes/
│   │   │   └── api.routes.js         # API routes
│   │   └── services/
│   │       └── user.service.js       # Business logic
│   ├── data/
│   │   └── resources.json            # Protected data
│   ├── server.js
│   └── package.json
│
└── README.md                      # This file
```

---

## 🔄 OAuth2.0 + PKCE Flow (How it maps to your Basic Auth)

### Your Basic Auth Flow:

```
User → Login Form → Server validates → Session created → Dashboard
```

### OAuth2.0 + PKCE Flow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. User clicks "Login" on Client App (localhost:3000)                      │
│     └── Client generates: code_verifier + code_challenge (PKCE)             │
│                                                                             │
│  2. Client redirects to Authorization Server (localhost:4000/authorize)     │
│     └── URL includes: client_id, redirect_uri, code_challenge, scope        │
│                                                                             │
│  3. Auth Server shows login page (like your login.html)                     │
│     └── User enters credentials                                             │
│                                                                             │
│  4. Auth Server validates credentials (like your POST /login)               │
│     └── If valid, generates authorization_code                              │
│                                                                             │
│  5. Auth Server redirects back to Client (localhost:3000/callback)          │
│     └── URL includes: authorization_code                                    │
│                                                                             │
│  6. Client sends code + code_verifier to Auth Server (/token)               │
│     └── Auth Server verifies PKCE & exchanges code for tokens               │
│                                                                             │
│  7. Auth Server returns tokens:                                             │
│     ├── access_token  (like your session - used to access resources)        │
│     ├── id_token      (OIDC - contains user info)                           │
│     └── refresh_token (to get new access_token without re-login)            │
│                                                                             │
│  8. Client uses access_token to call Resource Server (localhost:5000)       │
│     └── Resource Server validates token & returns protected data            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Concepts Mapping

| Basic Auth (Your Code)    | OAuth2.0 + PKCE + OIDC                 |
| ------------------------- | -------------------------------------- |
| `req.session.user`        | `access_token` (JWT)                   |
| `isAuthenticated`         | Token validation middleware            |
| `isAuthorized`            | Token scopes & claims checking         |
| Login form on same server | Separate Authorization Server          |
| Session cookie            | Bearer token in Authorization header   |
| User info in session      | `id_token` contains user claims (OIDC) |
| Session expiry (1 min)    | Token expiry + refresh_token           |

---

## 🚀 Quick Start

```bash
# Terminal 1 - Start Authorization Server
cd "Modern Auth/authorization-server"
npm install
npm start

# Terminal 2 - Start Client App
cd "Modern Auth/client-app"
npm install
npm start

# Terminal 3 - Start Resource Server
cd "Modern Auth/resource-server"
npm install
npm start
```

Then open: http://localhost:3000

---

## 📚 Files Description

### Authorization Server (The Identity Provider)

| File                  | Purpose                            | Similar to Basic Auth |
| --------------------- | ---------------------------------- | --------------------- |
| `server.js`           | Entry point, middleware setup      | Your `server.js`      |
| `auth.controller.js`  | Handles /authorize, login, consent | Your POST `/login`    |
| `token.controller.js` | Issues access_token, id_token      | Creating session      |
| `pkce.service.js`     | Validates code_challenge/verifier  | N/A (new security)    |
| `users.json`          | User credentials                   | Your `users.json`     |
| `clients.json`        | Registered applications            | N/A (new concept)     |

### Client App (Your Frontend)

| File             | Purpose                | Similar to Basic Auth |
| ---------------- | ---------------------- | --------------------- |
| `index.html`     | Landing page           | Your login.html       |
| `callback.html`  | Handles OAuth redirect | N/A (new flow)        |
| `dashboard.html` | Protected page         | Your dashboard.html   |
| `pkce.js`        | Generates PKCE codes   | N/A (new security)    |
| `auth.js`        | Manages OAuth flow     | N/A (new flow)        |

### Resource Server (Protected API)

| File                  | Purpose                | Similar to Basic Auth   |
| --------------------- | ---------------------- | ----------------------- |
| `token.middleware.js` | Validates access_token | Your `isAuthenticated`  |
| `api.routes.js`       | Protected endpoints    | Your `/dashboard` route |

---

## 🔒 Why PKCE?

PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks:

```
Without PKCE:
  Attacker intercepts auth_code → Can exchange for tokens → Account compromised

With PKCE:
  Attacker intercepts auth_code → Cannot exchange (doesn't have code_verifier) → Safe!
```

---

## 🆔 Why OIDC?

OAuth2.0 = Authorization (what can you access?)
OIDC = Authentication (who are you?)

OIDC adds:

- `id_token`: JWT containing user identity claims
- `/userinfo` endpoint: Get user profile
- Standard claims: `sub`, `name`, `email`, `picture`
