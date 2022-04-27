const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');

describe('/threads/{threadId}/comments/{commentId}/replies endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
  });

  let globalUserAccessToken = '';
  let threadId = '';
  let commentId = '';

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

    const { data: { addedComment } } = JSON.parse(addCommentResponse.payload);
    commentId = addedComment.id;
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 when add new reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah balasan',
      };

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedReply).toBeDefined();

      const { addedReply } = responseJson.data;
      expect(addedReply.id).toBeDefined();
      expect(addedReply.id).not.toEqual('');
      expect(typeof addedReply.id).toEqual('string');
      expect(addedReply.content).toBeDefined();
      expect(addedReply.content).not.toEqual('');
      expect(typeof addedReply.content).toEqual('string');
      expect(addedReply.owner).toBeDefined();
      expect(addedReply.owner).not.toEqual('');
      expect(typeof addedReply.owner).toEqual('string');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 401 when request with invalid authorization token', async () => {
      // Arrange
      const server = await createServer(container);

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload);
      const { data: { addedReply } } = addReplyResponseJson;
      const replyid = addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyid}`,
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload);
      const { data: { addedReply } } = addReplyResponseJson;
      const replyid = addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/not-found-thread-id/comments/${commentId}/replies/${replyid}`,
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload);
      const { data: { addedReply } } = addReplyResponseJson;
      const replyid = addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/not-found-comment-id/replies/${replyid}`,
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('komentar tidak ditemukan di database');
    });

    it('should response 403 when owner can not access the reply', async () => {
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan',
        },
        headers: {
          Authorization: `Bearer ${globalUserAccessToken}`,
        },
      });
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload);
      const { data: { addedReply } } = addReplyResponseJson;
      const replyid = addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyid}`,
        headers: {
          Authorization: `Bearer ${anotherUserToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.message).toBeDefined();
      expect(responseJson.message).toEqual('anda tidak berhak mengakses balasan tersebut');
    });

    it('should response 200 when delete reply', async () => {
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan',
        },
        headers: {
          Authorization: `Bearer ${anotherUserToken}`,
        },
      });
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload);
      const { data: { addedReply } } = addReplyResponseJson;
      const replyid = addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyid}`,
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
