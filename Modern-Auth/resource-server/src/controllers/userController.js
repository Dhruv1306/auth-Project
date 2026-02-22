// Example protected endpoint
async function getProfile(req, res) {
    res.json({
        message: 'This is your protected profile data!',
        user: req.user
    });
}

module.exports = { getProfile };

// "req.user" is set by the token middleware