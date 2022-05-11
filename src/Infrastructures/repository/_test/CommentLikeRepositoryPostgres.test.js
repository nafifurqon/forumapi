const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentLikeRepositoryPostgres = require('../CommentLikeRepositoryPostgres');

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

  describe('checkAvailabilityCommentLike function', () => {
    it('should return false when comment like not available', async () => {
      // Arrange
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool);
      const commentId = 'comment-123';
      const owner = 'not-found-owner-id';

      // Action
      const commentLikeAvailable = await commentLikeRepositoryPostgres
        .checkAvailabilityCommentLike({
          commentId, owner,
        });

      // Assert
      expect(commentLikeAvailable).toBe(false);
    });

    it('should return true when comment like available', async () => {
      // Arrange
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool);
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const commentLikeId = 'comment_like-123';
      const owner = 'user-123';

      await UsersTableTestHelper.addUser({ id: owner });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner,
      });
      await CommentLikesTableTestHelper.addCommentLike({
        id: commentLikeId, commentId, owner,
      });

      // Action
      const commentLikeAvailable = await commentLikeRepositoryPostgres
        .checkAvailabilityCommentLike({
          commentId, owner,
        });

      // Assert
      expect(commentLikeAvailable).toBe(true);
    });
  });

  describe('addCommentLike function', () => {
    it('should persist new comment like and return added comment like correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner: userId,
      });

      const newCommentLike = {
        commentId,
        owner: userId,
      };

      const fakeIdGenerator = () => '123';
      const commentLikeRepositoryPostgres
        = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentLikeRepositoryPostgres.addCommentLike(newCommentLike);

      // Assert
      const commentLikes = await CommentLikesTableTestHelper.findCommentLikesById('comment_like-123');
      expect(commentLikes).toHaveLength(1);
    });
  });

  describe('deleteCommentLike function', () => {
    it('should delete comment like in database', async () => {
      // Arrange
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool);
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const commentLikeId = 'comment_like-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner: userId,
      });
      await CommentLikesTableTestHelper.addCommentLike({
        id: commentLikeId, owner: userId, commentId,
      });

      const commentLikesBeforeDelete
        = await CommentLikesTableTestHelper.findCommentLikesById(commentLikeId);

      // Action
      await commentLikeRepositoryPostgres.deleteCommentLike({
        commentId, owner: userId,
      });

      // Assert
      const commentLikesAfterDelete
        = await CommentLikesTableTestHelper.findCommentLikesById(commentLikeId);

      expect(commentLikesBeforeDelete).toHaveLength(1);
      expect(commentLikesAfterDelete).toHaveLength(0);
    });
  });
});
