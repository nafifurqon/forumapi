const pool = require('../../database/postgres/pool');
const AuthenticationsTableTestHelper = require('../../../../tests/database/AuthenticationsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/database/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/database/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/database/CommentsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');
const UserAPITestHelper = require('../../../../tests/http/UserAPITestHelper');

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

  let userId = '';
  const username = 'dicoding';
  const password = 'secret';
  let globalUserAccessToken = '';
  const threadId = 'thread-123';

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

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 401 when request with invalid authorization token', async () => {
      // Arrange
      const server = await createServer(container);

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Komentar',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload);
      const { data: { addedComment } } = addCommentResponseJson;
      const commentId = addedComment.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
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

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Komentar',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload);
      const { data: { addedComment } } = addCommentResponseJson;
      const commentId = addedComment.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/not-found-thread-id/comments/${commentId}`,
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
        method: 'DELETE',
        url: `/threads/${threadId}/comments/not-found-comment-id`,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('komentar tidak ditemukan di database');
    });

    it('should response 403 when user can not access the comment', async () => {
      // Arrange
      const server = await createServer(container);

      const anotherUserId = 'another_user-123';
      const anotherUserCommentId = 'comment-124';

      // add another user
      await UsersTableTestHelper.addUser({
        id: anotherUserId,
        username: 'anotheruser',
        fullname: 'Another User',
      });

      // add comment by another user
      await CommentsTableTestHelper.addComment({
        id: anotherUserCommentId,
        content: 'Komentar',
        threadId,
        owner: anotherUserId,
      });

      // add comment
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Komentar',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${anotherUserCommentId}`,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('anda tidak berhak mengakses komentar tersebut');
    });

    it('should response 200 when delete comment', async () => {
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

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Komentar',
        },
        headers: {
          Authorization: `Bearer ${anotherUserToken}`,
        },
      });
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload);
      const { data: { addedComment } } = addCommentResponseJson;
      const commentId = addedComment.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${anotherUserToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });
});
