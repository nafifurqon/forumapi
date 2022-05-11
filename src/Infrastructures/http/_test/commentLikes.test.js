const pool = require('../../database/postgres/pool');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');

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

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
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

    // it('should response 200 when like a comment', async () => {
    //   // Arrange
    //   const server = await createServer(container);

    //   // Action
    //   const response = await server.inject({
    //     method: 'PUT',
    //     url: `/threads/${threadId}/comments/${commentId}/likes`,
    //     headers: {
    //       Authorization: `Bearer ${globalUserAccessToken}`,
    //     },
    //   });

    //   // Assert
    //   const responseJson = JSON.parse(response.payload);
    //   expect(responseJson.statusCode).toEqual(200);
    //   expect(responseJson.status).toEqual('success');
    // });
  });
});
