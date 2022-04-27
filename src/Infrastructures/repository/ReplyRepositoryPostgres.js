const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const DetailReply = require('../../Domains/replies/entities/DetailReply');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(newReply) {
    const { content, commentId, owner } = newReply;
    const id = `reply-${this._idGenerator()}`;
    const isDelete = false;
    const now = new Date().toISOString();
    const createdAt = now;
    const updatedAt = now;

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner',
      values: [id, content, commentId, owner, isDelete, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    return new AddedReply({ ...result.rows[0] });
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: 'SELECT r.id, r.content, r.created_at as date, u.username '
      + 'FROM replies as r '
      + 'LEFT JOIN users as u ON u.id = r.owner '
      + 'WHERE r.comment_id = $1 '
      + 'ORDER BY r.created_at ASC',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      return [];
    }

    return result.rows.map((row) => new DetailReply(row));
  }
}

module.exports = ReplyRepositoryPostgres;
