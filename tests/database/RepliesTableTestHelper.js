/* istanbul ignore file */
const pool = require('../../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'Balasan',
    commentId = 'comment-123',
    owner = 'user-123',
    date,
  }) {
    const isDelete = false;
    const now = date || new Date().toISOString();

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6, $6) RETURNING id, content, owner',
      values: [id, content, commentId, owner, isDelete, now],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async deleteReplyById(id) {
    const query = {
      text: 'DELETE FROM replies WHERE id = $1',
      values: [id],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

module.exports = RepliesTableTestHelper;
