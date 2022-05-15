const CommentLikeRepository = require('../../Domains/comment_likes/CommentLikeRepository');

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async checkCommentAvailabilityLike({ commentId, owner }) {
    const query = {
      text: 'SELECT comment_id, owner FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      return true;
    }

    return false;
  }

  async addCommentLike({ commentId, owner }) {
    const id = `comment_like-${this._idGenerator()}`;
    const now = new Date().toISOString();

    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3, $4, $4) RETURNING id, comment_id, owner',
      values: [id, owner, commentId, now],
    };

    const result = await this._pool.query(query);

    return result.rows[0];
  }

  async deleteCommentLike({ commentId, owner }) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }
}

module.exports = CommentLikeRepositoryPostgres;
