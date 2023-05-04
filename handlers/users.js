const redis = require('./lib/redis')

redis.once('ready', async () => {
    try {
        await redis.init();

        app.get('/', (req, res) => {
            res.render(path.join(__dirname, 'views', 'index.ejs'));
        });        


        app.listen(3000, () => {
            console.log('start listening');
        });
    } catch {
        console.error(err);
        process.exit(1);
    }
});

const getUser = async (req) => {
    const key = `users:${req.params.id}`;
    const val = await redis.get(key);
    const user = JSON.parse(val);
    return user;
}

app.get('/user/id:', async (req, res) => {
    try {
        const user = getUser(req);
        res.status(200).json(user);
    } catch {
        console.error(err);
        res.status(500).send(('internal error'));
    }
});

const getUsers = async () => {
    const stream = redis.scanStream({
        match: 'users:*',
        count: 2
    });

    for await (const resultKeys of stream) {
        for (const key of resultKeys) {
            const value = await redis.get(key);
            const user = JSON.parse(value);
            users.push(user);
        }
    }

    return { users: users };
}

app.get('/users', async (req, res) => {
    try {
        const locals = await getUsers(req);
        res.render(path.join(__dirname, 'views', 'users.ejs'), locals);
    } catch {
        console.error(err);
    }
});

exports.getUser = getUser;
exports.getUsers = getUsers;