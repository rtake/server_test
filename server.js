const express = require('express');
const redis = require('./lib/redis')
const userHandler = require('./handlers/users');
const express = require('express');


// app.use('/static', express.static(path.join(__dirname, 'public')));

const app = express();

app.get('/user/:id', async (req, res) => {
    try {
        const user = userHandler.getUser(req);
        res.status(200).json(user);
    } catch(err) {
        console.error(err);
        res.status(500).send('internal error');
    }
});

app.get('/users', async (req, res) => {
    try {
        const locals = userHandler.getUsers(req);
        res.render(path.join(__dirname, 'views', 'users.ejs'), locals);
    } catch(err) {
        console.error(err);
    }
});

redis.connect()
    .once('ready', async () => {
        try {
            await redis.init();

            app.listen(3000, () => {
                console.log('start listening');
            });
        } catch(err) {
            console.error(err);
            process.exit(1);
        }
    })
    .on('error', () => {
        console.error(err);
        process.exit(1);
    });


app.set('view engine', 'ejs');