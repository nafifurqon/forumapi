const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedThread = require('../../Domains/threads/entities/AddedThread');
const DetailThread = require('../../Domains/threads/entities/DetailThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(newThread) {
    const { title, body, owner } = newThread;
    const id = `thread-${this._idGenerator()}`;
    const now = new Date().toISOString();

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, $5, $5) RETURNING id, title, owner',
      values: [id, title, body, owner, now],
    };

    const result = await this._pool.query(query);

    return new AddedThread({ ...result.rows[0] });
  }

  async checkAvailabilityThread(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan di database');
    }
  }

  async getThreadById(threadId) {
    const query = {
      text: 'SELECT t.id, t.title, t.body, created_at as date, u.username '
      + 'FROM threads as t '
      + 'LEFT JOIN users as u ON u.id = t.owner '
      + 'WHERE t.id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return new DetailThread({ ...result.rows[0] });
  }
}

module.exports = ThreadRepositoryPostgres;
