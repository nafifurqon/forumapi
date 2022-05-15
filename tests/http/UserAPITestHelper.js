/* istanbul ignore file */
const createServer = require('../../src/Infrastructures/http/createServer');
const container = require('../../src/Infrastructures/container');

const UserAPITestHelper = {
  async addUser({
    username = 'dicoding',
    password = 'secret',
    fullname = 'Dicoding Indonesia',
  }) {
    const server = await createServer(container);

    const addUserResponse = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username,
        password,
        fullname,
      },
    });

    return addUserResponse;
  },

  async loginUser({
    username = 'dicoding',
    password = 'secret',
  }) {
    const server = await createServer(container);

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username,
        password,
      },
    });

    return loginResponse;
  },
};

module.exports = UserAPITestHelper;
