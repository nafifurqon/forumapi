const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const DetailReply = require('../../Domains/replies/entities/DetailReply');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

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

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6, $6) RETURNING id, content, owner',
      values: [id, content, commentId, owner, isDelete, now],
    };

    const result = await this._pool.query(query);

    return new AddedReply(result.rows[0]);
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: 'SELECT r.id, r.created_at as date, u.username, '
      + "CASE WHEN r.is_delete THEN '**balasan telah dihapus**' ELSE r.content "
      + 'END as content '
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

  async checkAvailabilityReply(replyId) {
    const query = {
      text: 'SELECT id FROM replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('balasan tidak ditemukan di database');
    }
  }

  async verifyReplyAccess({ replyId, owner }) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1 and owner = $2',
      values: [replyId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('anda tidak berhak mengakses balasan tersebut');
    }
  }

  async deleteReply(replyId) {
    const updatedIsDelete = true;

    const query = {
      text: 'UPDATE replies SET is_delete = $1 WHERE id = $2',
      values: [updatedIsDelete, replyId],
    };

    await this._pool.query(query);
  }
}

module.exports = ReplyRepositoryPostgres;
