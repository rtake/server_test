const mockRedisGet = jest.fn();
const mockRedisScanStream = jest.fn();
jest.mock('../lib/redis', () => {
    return {
        getClient: jest.fn().mockImplementation(() => {
            return {
                get: mockRedisGet,
                scanStream: mockRedisScanStream
            };
        })
    };
});

const { getUser, getUsers } = require('./users');

beforeEach(() => {
    mockRedisGet.mockClear();
    mockRedisScanStream.mockClear();
});

test('getUser', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify({ id: 1, name: 'alpha'}));

    const reqMock = { params: { id: 1 } };

    const res = await getUser(reqMock);

    expect(res.id).toStrictEqual(1);
    expect(res.name).toStrictEqual('alpha');

    expect(mockRedisGet).toHaveBeenCalledTimes(1);

    const [arg1] = mockRedisGet.mock.calls[0];
    expect(arg1).toStrictEqual('users:1');
});

test('getUsers', async () => {
    const streamMock = {
        // 1回目で ['users:1', 'users:2'], 2回目で ['users:3', 'users:4'] が返されるようにする
        // streamを表現
        async* [Symbol.asyncIterator]() {
            yield ['users:1', 'users:2'];
            yield ['users:3', 'users:4'];
        }
    };

    // Redisのモックでstreamのモックが返されるようにする
    mockRedisScanStream.mockReturnValueOnce(streamMock);
    
    // Get関数のモックを実装(値がそのまま返されるようにする)
    mockRedisGet.mockImplementation((key) => {
        switch (key) {
            case 'users:1':
                return Promise.resolve(JSON.stringify({ id: 1, name: 'alpha' }));
            case 'users:2':
                return Promise.resolve(JSON.stringify({ id: 2, name: 'bravo' }));
            case 'users:3':
                return Promise.resolve(JSON.stringify({ id: 3, name: 'charlie' }));
            case 'users:4':
                return Promise.resolve(JSON.stringify({ id: 4, name: 'delta' }));
        }
        return Promise.resolve(null);
    });

    // 呼び出し回数のテスト
    const reqMock = {}; // 空のオブジェクトでもいい

    const res = await getUsers(reqMock);

    expect(mockRedisScanStream).toHaveBeenCalledTimes(1);
    expect(mockRedisGet).toHaveBeenCalledTimes(4);

    // 戻り値のテスト
    expect(res.users.length).toStrictEqual(4);
    expect(res.users).toStrictEqual([
        { id:1, name: 'alpha'},
        { id:2, name: 'bravo'},
        { id:3, name: 'charlie'},
        { id:4, name: 'delta'}
    ]);
});