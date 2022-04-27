const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const DetailReply = require('../../../Domains/replies/entities/DetailReply');

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

    it('should return array or list of comments correctly', async () => {
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
      };

      await UsersTableTestHelper.addUser({ ...user });
      await ThreadsTableTestHelper.addThread({ ...thread });
      await CommentsTableTestHelper.addComment({ ...comment });
      await RepliesTableTestHelper.addReply({ ...reply });

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id);

      // Assert
      expect(replies).toHaveLength(1);
      expect(replies[0]).toStrictEqual(new DetailReply({ ...expectedDetailReply }));
    });

    it('should return array or list of comments sorted form most past', async () => {
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
  });
});
