const Redis = require('ioredis');
const express = require('express');
const app = express();

const redis = new Redis({
    port: 6379,
    host: 'localhost',
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: false
});

const init = async() => {
    await Promise.all([
        redis.set('users:1', JSON.stringify({ id: 1, name: 'alpha'})),
        redis.set('users:2', JSON.stringify({ id: 2, name: 'bravo'})),
        redis.set('users:3', JSON.stringify({ id: 3, name: 'charlie'})),
        redis.set('users:4', JSON.stringify({ id: 4, name: 'delta'}))
    ]);
};

app.get('/', (req, res) => {
    res.status(200).send('hello world\n');
});

app.get('/user/:id', (req, res) => {
    res.status(200).send(req.params.id);
});

redis.once('ready', async () => {
    try {
        await init();

        app.get('/user/id:', async (req, res) => {
            try {
                const key = `users:${req.params.id}`;
                const val = await redis.get(key);
                const user = JSON.parse(val);
                res.status(200).json(user);
            } catch {
                console.error(err);
                res.status(500).send(('internal error'));
            }
        })

        app.get('/users', async (req, res) => {
            try {
                const stream = redis.scanStream({
                    match: 'users:*',
                    count: 2
                });

                const users = [];
                for await (const resultKeys of stream) {
                    for (const key of resultKeys) {
                        const value = await redis.get(key);
                        const user = JSON.parse(value);
                        users.push(user);
                    }
                }
                res.status(200).json(users);
            } catch {
                console.error(err);
                res.status(500).send(('internal error'));
            }
        })

        app.listen(3000, () => {
            console.log('start listening');
        });
    } catch {
        console.error(err);
        process.exit(1);
    }
})

redis.on('error', (err) => {
    console.error(err);
    process.exit(1);
})