const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const DetailReply = require('../../../Domains/replies/entities/DetailReply');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgrres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId });

      const newReply = {
        content: 'Balasan',
        owner: userId,
        commentId,
      };

      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const test = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return empty array when replies not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId });

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(commentId);

      // Assert
      expect(replies).toHaveLength(0);
    });

    it('should return array or list of replies correctly', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
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

      const reply = {
        id: 'reply-123',
        commentId: comment.id,
        date: now,
        content: 'Komentar',
        owner: user.id,
      };

      const expectedDetailReply = {
        id: reply.id,
        username: user.username,
        date: reply.date,
        content: reply.content,
        is_delete: false,
      };

      await UsersTableTestHelper.addUser({ ...user });
      await ThreadsTableTestHelper.addThread({ ...thread });
      await CommentsTableTestHelper.addComment({ ...comment });
      await RepliesTableTestHelper.addReply({ ...reply });

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id);

      // Assert
      expect(replies).toHaveLength(1);
      expect(replies[0]).toStrictEqual(expectedDetailReply);
    });

    it('should return array or list of replies sorted form most past', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

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
        date: new Date('2022-04-26').toISOString(),
      };

      const comment = {
        id: 'comment-123',
        threadId: thread.id,
        date: new Date('2022-04-26').toISOString(),
        content: 'Komentar',
        owner: firstUser.id,
      };

      const secondUserReply = {
        id: 'reply-001',
        content: 'Komentar 1',
        commentId: comment.id,
        owner: secondUser.id,
        date: new Date('2022-04-26').toISOString(),
      };

      const firstUserReply = {
        id: 'reply-002',
        content: 'Komentar 2',
        commentId: comment.id,
        owner: firstUser.id,
        date: new Date().toISOString(),
      };

      // add user
      await UsersTableTestHelper.addUser({ ...firstUser });
      await UsersTableTestHelper.addUser({ ...secondUser });

      // add thread
      await ThreadsTableTestHelper.addThread({ ...thread });

      // add comment
      await CommentsTableTestHelper.addComment({ ...comment });

      // add reply
      await RepliesTableTestHelper.addReply({ ...secondUserReply });
      await RepliesTableTestHelper.addReply({ ...firstUserReply });

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id);

      // Assert
      const firstReplyDate = new Date(replies[0].date);
      const secondReplyDate = new Date(replies[1].date);

      expect(replies).toHaveLength(2);
      expect(firstReplyDate.getTime()).toBeLessThan(secondReplyDate.getTime());
    });

    it('should return array or list of replies correctly and is_delete = true '
      + 'when reply was deleted.', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
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

      const reply = {
        id: 'reply-123',
        commentId: comment.id,
        date: now,
        content: 'Komentar',
        owner: user.id,
      };

      const expectedDetailReply = {
        id: reply.id,
        username: user.username,
        date: reply.date,
        content: reply.content,
        is_delete: true,
      };

      await UsersTableTestHelper.addUser({ ...user });
      await ThreadsTableTestHelper.addThread({ ...thread });
      await CommentsTableTestHelper.addComment({ ...comment });
      await RepliesTableTestHelper.addReply({ ...reply });
      await replyRepositoryPostgres.deleteReply(reply.id);

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id);

      // Assert
      expect(replies).toHaveLength(1);
      expect(replies[0]).toStrictEqual(expectedDetailReply);
    });
  });

  describe('checkAvailabilityReply function', () => {
    it('should throw NotFoundError when reply not available', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
      const replyId = 'not-found-reply-id';

      // Action & Assert
      expect(replyRepositoryPostgres.checkAvailabilityReply(replyId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when reply available', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const replyId = 'reply-123';

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner: userId,
      });
      await RepliesTableTestHelper.addReply({
        id: replyId, commentId, owner: userId,
      });

      // Action & Assert
      expect(replyRepositoryPostgres.checkAvailabilityReply(replyId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyReplyAccess function', () => {
    it('should throw AuthorizationError when owner do not have access to the reply', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
      const owner = 'owner-123';
      const anotherUser = 'anotherUser-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const replyId = 'reply-123';

      await UsersTableTestHelper.addUser({ id: owner });
      await UsersTableTestHelper.addUser({ id: anotherUser, username: 'anotheruser' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner: anotherUser,
      });
      await RepliesTableTestHelper.addReply({
        id: replyId, threadId, owner: anotherUser,
      });

      // Action & Assert
      expect(replyRepositoryPostgres.verifyReplyAccess({ replyId, owner }))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw AuthorizationError when owner have access to the reply', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);
      const owner = 'owner-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const replyId = 'reply-123';

      await UsersTableTestHelper.addUser({ id: owner });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner });
      await CommentsTableTestHelper.addComment({
        id: commentId, threadId, owner,
      });
      await RepliesTableTestHelper.addReply({
        id: replyId, commentId, owner,
      });

      // Action & Assert
      expect(replyRepositoryPostgres.verifyReplyAccess({ replyId, owner }))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteReply function', () => {
    it('should update is_delete from comment in database', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

      const newUser = {
        id: 'user-123',
      };

      const newComment = {
        id: 'comment-123',
        content: 'Komentar',
        threadId: 'thread-123',
        owner: 'user-123',
      };

      const newReply = {
        id: 'reply-123',
        content: 'Balasan',
        commentId: 'comment-123',
        owner: 'user-123',
      };

      const expectedDeletedReply = {
        id: newReply.id,
        content: newReply.content,
        is_delete: true,
      };

      await UsersTableTestHelper.addUser({ id: newUser.id });
      await ThreadsTableTestHelper.addThread({
        id: newComment.threadId, owner: newUser.id,
      });
      await CommentsTableTestHelper.addComment(newComment);
      await RepliesTableTestHelper.addReply(newReply);

      const repliesBeforeDelete = await RepliesTableTestHelper.findRepliesById(newReply.id);
      const replyBeforeDelete = repliesBeforeDelete[0];

      // Action
      await replyRepositoryPostgres.deleteReply(newReply.id);

      // Assert
      const repliesAfterDelete = await RepliesTableTestHelper.findRepliesById(newReply.id);
      const replyAfterDelete = repliesAfterDelete[0];

      expect(replyBeforeDelete.is_delete).toEqual(false);
      expect(replyAfterDelete.is_delete).toEqual(expectedDeletedReply.is_delete);
    });
  });
});
