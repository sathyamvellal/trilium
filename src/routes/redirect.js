var aliases = require('./redirect_aliases');
const request = require('request');

function register(router) {
    for (const alias in aliases) {
        router.get(alias, (req, res, next) => {
            // res.redirect(aliases[alias]);
            request('http://' + req.hostname + '/' + aliases[alias]).pipe(res);
        });
    }
}

module.exports = {
    register
}