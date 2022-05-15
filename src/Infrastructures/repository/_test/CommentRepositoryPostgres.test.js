const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await CommentLikesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

      const newComment = {
        content: 'Komentar',
        owner: userId,
        threadId,
      };

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepositoryPostgres.addComment(newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
    });
  });

  describe('checkCommentAvailability function', () => {
    it('should throw NotFoundError when comment not available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const commentId = 'not-found-comment-id';

      // Action & Assert
      expect(commentRepositoryPostgres.checkCommentAvailability(commentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when comment available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner: userId,
      });

      // Action & Assert
      expect(commentRepositoryPostgres.checkCommentAvailability(commentId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentAccess function', () => {
    it('should throw AuthorizationError when owner do not have access to the comment', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      const owner = 'owner-123';
      const anotherUser = 'anotherUser-123';

      await UsersTableTestHelper.addUser({ id: owner });
      await UsersTableTestHelper.addUser({ id: anotherUser, username: 'anotheruser' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner: anotherUser,
      });

      // Action & Assert
      expect(commentRepositoryPostgres.verifyCommentAccess({ commentId, owner }))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw AuthorizationError when owner have access to the comment', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      const owner = 'owner-123';
      const anotherUser = 'anotherUser-123';

      await UsersTableTestHelper.addUser({ id: owner });
      await UsersTableTestHelper.addUser({ id: anotherUser, username: 'anotheruser' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner,
      });

      // Action & Assert
      expect(commentRepositoryPostgres.verifyCommentAccess({ commentId, owner }))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
    it('should update is_delete from comment in database', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const newComment = {
        id: 'comment-123',
        content: 'Komentar',
        threadId: 'thread-123',
        owner: 'user-123',
      };

      const expectedDeletedComment = {
        id: newComment.id,
        content: newComment.content,
        is_delete: true,
      };

      await UsersTableTestHelper.addUser({ id: newComment.owner });
      await ThreadsTableTestHelper.addThread({
        id: newComment.threadId, owner: newComment.owner,
      });
      await CommentsTableTestHelper.addComment(newComment);

      const commentsBeforeDelete = await CommentsTableTestHelper.findCommentsById(newComment.id);
      const commentBeforeDelete = commentsBeforeDelete[0];

      // Action
      await commentRepositoryPostgres.deleteComment(newComment.id);

      // Assert
      const commentsAfterDelete = await CommentsTableTestHelper.findCommentsById(newComment.id);
      const commentAfterDelete = commentsAfterDelete[0];

      expect(commentBeforeDelete.is_delete).toEqual(false);
      expect(commentAfterDelete.is_delete).toEqual(expectedDeletedComment.is_delete);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return empty array when comments not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const threadId = 'thread-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toHaveLength(0);
    });

    it('should return array or list of comments correctly', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const now = new Date().toISOString();

      const user = {
        id: 'user-123',
        username: 'user1',
        fullname: 'First User',
      };

      const thread = {
        id: 'thread-123',
        title: 'Judul',
        body: 'Body',
        owner: user.id,
        date: now,
      };

      const comment = {
        id: 'comment-123',
        threadId: thread.id,
        date: now,
        content: 'Komentar',
        owner: user.id,
      };

      const commentLike = {
        id: 'comment_likes-123',
        commentId: comment.id,
        owner: user.id,
        date: now,
      };

      const expectedDetailComment = {
        id: 'comment-123',
        username: user.username,
        date: comment.date,
        content: comment.content,
        is_delete: false,
        like_count: 1,
        replies: [],
      };

      await UsersTableTestHelper.addUser({ ...user });
      await ThreadsTableTestHelper.addThread({ ...thread });
      await CommentsTableTestHelper.addComment({ ...comment });
      await CommentLikesTableTestHelper.addCommentLike({ ...commentLike });

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(thread.id);

      // Assert
      expect(comments).toHaveLength(1);
      expect(comments[0]).toStrictEqual(expectedDetailComment);
    });

    it('should return array or list of comments correctly and is_delete = true '
      + 'when comment was deleted.', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const now = new Date().toISOString();

      const user = {
        id: 'user-123',
        username: 'user1',
        fullname: 'First User',
      };

      const thread = {
        id: 'thread-123',
        title: 'Judul',
        body: 'Body',
        owner: user.id,
        date: now,
      };

      const comment = {
        id: 'comment-123',
        threadId: thread.id,
        date: now,
        content: 'Komentar',
        owner: user.id,
      };

      const expectedDeletedComment = {
        id: 'comment-123',
        username: user.username,
        date: now,
        content: comment.content,
        is_delete: true,
        like_count: 0,
        replies: [],
      };

      await UsersTableTestHelper.addUser({ ...user });
      await ThreadsTableTestHelper.addThread({ ...thread });
      await CommentsTableTestHelper.addComment({ ...comment });
      await commentRepositoryPostgres.deleteComment(comment.id);

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(thread.id);

      // Assert
      expect(comments).toHaveLength(1);
      expect(comments[0]).toStrictEqual(expectedDeletedComment);
    });

    it('should return array or list of comments sorted form most past', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      const firstUser = {
        id: 'user-001',
        username: 'user1',
        fullname: 'First User',
      };
      const secondUser = {
        id: 'user-002',
        username: 'user2',
        fullname: 'Second User',
      };

      const thread = {
        id: 'thread-123',
        title: 'Judul',
        body: 'Body',
        owner: firstUser.id,
        date: new Date().toISOString(),
      };

      const secondUserComment = {
        id: 'comment-001',
        content: 'Komentar 1',
        threadId: thread.id,
        owner: secondUser.id,
        date: new Date('2022-04-25').toISOString(),
      };

      const firstUserComment = {
        id: 'comment-002',
        content: 'Komentar 2',
        threadId: thread.id,
        owner: firstUser.id,
        date: new Date().toISOString(),
      };

      // add user
      await UsersTableTestHelper.addUser({ ...firstUser });
      await UsersTableTestHelper.addUser({ ...secondUser });

      // add thread
      await ThreadsTableTestHelper.addThread({ ...thread });

      // add comment
      await CommentsTableTestHelper.addComment({ ...secondUserComment });
      await CommentsTableTestHelper.addComment({ ...firstUserComment });

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(thread.id);

      // Assert
      const firstCommentDate = new Date(comments[0].date);
      const secondCommentDate = new Date(comments[1].date);

      expect(comments).toHaveLength(2);
      expect(firstCommentDate.getTime()).toBeLessThan(secondCommentDate.getTime());
    });
  });
});
