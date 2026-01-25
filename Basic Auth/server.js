// Date:- 25th Jan 2026

const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const fs = require('fs');
app.listen(3000, '0.0.0.0', ()=> { console.log(`Server is running on http://localhost:3000`); })

app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'src')));
app.use(session({
    secret : 'KEY',
    resave : false,
    saveUninitialized : true,
    cookie : {
        secure : false,
        maxAge : 1000 * 60 * 1    // 1 min
    }
}));

app.use((req,res,next) => {               // custom middleware
    res.locals.VISA = req.session.user;
    next();
})

const isAuthenticated = (req,res,next) => {         // Who
    const VISA = res.locals.VISA;
    if(VISA) return next();
    return res.redirect('/login?expired=true');    // Passing "expired" as a QUERY PARAMETER. Handled in the "script" tag inside "login.html".
}

const isAuthorized = (req,res,next) => {         // What
    const VISA = res.locals.VISA;
    const queryRole = req.query.role;
    const queryName = req.query.name;
    if(VISA.role != queryRole) return res.status(401).send(`You are not authorized to access ${queryRole} resources.`);
    if(VISA.username != queryName) return res.status(401).send(`You are not authorized to access ${queryRole}, ${queryName}'s resources.`);
    if(VISA) return next();
}

app.get('/', (req,res) => { res.send("Hello Friends!!"); });

app.get('/registration', (req,res) => {
    res.status(200).sendFile('./src/UI/user/registration.html', {root: __dirname});
});

app.post('/registration', (req,res) => {
    const userData = req.body;
    userData.isAdmin = false;
    const users = JSON.parse(fs.readFileSync('./src/data/users.json', 'utf-8'));
    users.push(userData);
    fs.writeFileSync('./src/data/users.json', JSON.stringify(users, null, 4));
    res.redirect('/login');
});

app.get('/login', (req,res) => {
    res.status(200).sendFile('./src/UI/login.html', {root:__dirname});
});

app.post('/login', (req,res) => {
    const bodyData = req.body;
    const users = JSON.parse(fs.readFileSync('./src/data/users.json', 'utf8'));  // both 'utf-8' & 'utf8' works
    const user = users.find(u => u.email === bodyData.email);
    if(!user) return res.status(404).send("User doesn't exit");
    if(user.password != bodyData.password) return res.status(401).send("Wrong password");
    req.session.user = {...user, role : user.isAdmin ? 'admin' : 'user'};
    return (user.isAdmin == true) ? res.redirect(`/dashboard?role=admin&name=${user.username}`) : res.redirect(`/dashboard?role=user&name=${user.username}`);  // passing as a Query, which contains key-value pair 
});

app.get('/dashboard', isAuthenticated, isAuthorized, (req,res) => {
    const Role = req.query.role;        // Extracted from query string
    const queryName = req.query.name;   
    return res.status(200).sendFile(`./src/UI/${Role}/dashboard.html`, {root:__dirname});
});