const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
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

  describe('checkAvailabilityComment function', () => {
    it('should throw NotFoundError when comment not available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const commentId = 'not-found-comment-id';

      // Action & Assert
      expect(commentRepositoryPostgres.checkAvailabilityComment(commentId))
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
      expect(commentRepositoryPostgres.checkAvailabilityComment(commentId))
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
    it('should update is_delete and content from comment in database', async () => {
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
        content: '**komentar telah dihapus**',
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
      expect(commentBeforeDelete.content).toEqual(newComment.content);

      expect(commentAfterDelete.is_delete).toEqual(expectedDeletedComment.is_delete);
      expect(commentAfterDelete.content).toEqual(expectedDeletedComment.content);
    });
  });
});
