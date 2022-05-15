const pool = require('../../database/postgres/pool');
const AuthenticationsTableTestHelper = require('../../../../tests/database/AuthenticationsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/database/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/database/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/database/CommentsTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/database/AuthenticationsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');
const UserAPITestHelper = require('../../../../tests/http/UserAPITestHelper');

describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await CommentLikesTableTestHelper.cleanTable();
  });

  let userId = '';
  const username = 'dicoding';
  const password = 'secret';
  let globalUserAccessToken = '';
  const threadId = 'thread-123';
  const commentId = 'comment-123';

  beforeEach(async () => {
    // add user
    const addUserResponse = await UserAPITestHelper.addUser({
      username,
      password,
      fullname: 'Dicoding Indonesia',
    });

    const { data: { addedUser } } = JSON.parse(addUserResponse.payload);
    userId = addedUser.id;

    // login user
    const loginResponse = await UserAPITestHelper.loginUser({
      username,
      password,
    });

    const { data: { accessToken } } = JSON.parse(loginResponse.payload);
    globalUserAccessToken = accessToken;

    // add thread
    await ThreadsTableTestHelper.addThread({
      id: threadId,
      title: 'Judul',
      body: 'Body',
      owner: userId,
    });

    // add comment
    await CommentsTableTestHelper.addComment({
      id: commentId,
      content: 'Komentar',
      threadId,
      owner: userId,
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 401 when request with invalid authorization token', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
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
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/not-found-thread-id/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('thread tidak ditemukan di database');
    });

    it('should response 404 when comment is not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/not-found-comment-id/likes`,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('komentar tidak ditemukan di database');
    });

    it('should response 200 when like the user\'s comment', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 200 when like other user\'s comment', async () => {
      // Arrange
      const server = await createServer(container);

      // add another user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'anotheruser',
          password: 'secret',
          fullname: 'Another User',
        },
      });

      // login another user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'anotheruser',
          password: 'secret',
        },
      });
      const { data } = JSON.parse(loginResponse.payload);
      const anotherUserToken = data.accessToken;

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${anotherUserToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });
});
