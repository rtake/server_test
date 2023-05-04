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

    const res = getUser(reqMock);

    expect(res.id).toStrictEqual(1);
    expect(res.name).toStrictEqual('alpha');

    expect(mockRedisGet).toHaveBeenCalledTimes(1);

    const [arg1] = mockRedisGet.mock.calls[0];
    expect(arg1).toStrictEqual('users:1');
});