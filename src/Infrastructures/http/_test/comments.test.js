const pool = require('../../database/postgres/pool');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');

describe('/threads/{threadId}/comments endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  let globalUserAccessToken = '';
  let threadId = '';

  beforeEach(async () => {
    const server = await createServer(container);

    // add user
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      },
    });

    // login user
    const loginResponse = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'dicoding',
        password: 'secret',
      },
    });

    const { data: { accessToken } } = JSON.parse(loginResponse.payload);
    globalUserAccessToken = accessToken;

    // add thread
    const addThreadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: {
        title: 'Judul Thread',
        body: 'Body thread.',
      },
      headers: {
        Authorization: `Bearer ${globalUserAccessToken}`,
      },
    });

    const { data: { addedThread } } = JSON.parse(addThreadResponse.payload);
    threadId = addedThread.id;
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 401 when request with invalid authorization token', async () => {
      // Arrange
      const requestPayload = {
        content: 'Komentar',
      };

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: 'invalid-access-token',
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread is not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'Komentar',
      };
      const notFoundThreadId = 'xxx-123';

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${notFoundThreadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('thread tidak ditemukan di database');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {};

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('tidak dapat menambah comment karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        content: 12345,
      };

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('tidak dapat menambah comment karena tipe data tidak sesuai');
    });

    it('should response 201 when add new comment', async () => {
      // Arrange
      const requestPayload = {
        content: 'Komentar',
      };

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();

      const { addedComment } = responseJson.data;
      expect(addedComment.id).toBeDefined();
      expect(addedComment.id).not.toEqual('');
      expect(typeof addedComment.id).toEqual('string');
      expect(addedComment.content).toBeDefined();
      expect(addedComment.content).not.toEqual('');
      expect(typeof addedComment.content).toEqual('string');
      expect(addedComment.owner).toBeDefined();
      expect(addedComment.owner).not.toEqual('');
      expect(typeof addedComment.owner).toEqual('string');
    });
  });
});
