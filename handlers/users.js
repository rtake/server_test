const redis = require('../lib/redis')

const getUser = async (req) => {
    const key = `users:${req.params.id}`;
    const val = await redis.getClient().get(key);
    const user = JSON.parse(val);
    return user;
}

const getUsers = async () => {
    const stream = redis.getClient().scanStream({
        match: 'users:*',
        count: 2
    });

    const users = [];
    for await (const resultKeys of stream) {
        for (const key of resultKeys) {
            const value = await redis.getClient().get(key);
            const user = JSON.parse(value);
            users.push(user);
        }
    }

    return { users: users };
}

exports.getUser = getUser;
exports.getUsers = getUsers;