/* istanbul ignore file */
const pool = require('../../src/Infrastructures/database/postgres/pool');

const CommentLikesTableTestHelper = {
  async addCommentLike({
    id = 'comment_likes-123',
    commentId = 'comment-123',
    owner = 'user-123',
    date,
  }) {
    const now = date || new Date().toISOString();

    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3, $4, $4) RETURNING id, comment_id, owner',
      values: [id, owner, commentId, now],
    };

    await pool.query(query);
  },

  async findCommentLikesById(id) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async deleteCommentLikesById(id) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE id = $1',
      values: [id],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM comment_likes WHERE 1=1');
  },
};

module.exports = CommentLikesTableTestHelper;
