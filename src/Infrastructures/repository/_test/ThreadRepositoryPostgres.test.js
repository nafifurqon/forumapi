const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({});
      const user = await UsersTableTestHelper.findUsersById('user-123');

      const newThread = new NewThread({
        title: 'Judul',
        body: 'Body',
        owner: user[0].id,
      });

      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
    });
  });

  describe('checkAvailabilityThread', () => {
    it('should throw NotFoundError when thread not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);
      const threadId = 'not-found-thread-id';

      // Action & Assert
      await expect(threadRepositoryPostgres.checkAvailabilityThread(threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not to throw NotFoundError when thread available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);
      const threadId = 'thread-123';

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const users = await UsersTableTestHelper.findUsersById('user-123');
      const userId = users[0].id;

      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

      // Action & Assert
      await expect(threadRepositoryPostgres.checkAvailabilityThread(threadId))
        .resolves.not.toThrow(NotFoundError);
    });
  });
});
