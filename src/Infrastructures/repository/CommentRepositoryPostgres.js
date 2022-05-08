const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');
const DetailComment = require('../../Domains/comments/entities/DetailComment');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, threadId, owner } = newComment;
    const id = `comment-${this._idGenerator()}`;
    const isDelete = false;
    const now = new Date().toISOString();

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6, $6) RETURNING id, content, owner',
      values: [id, content, threadId, owner, isDelete, now],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async checkAvailabilityComment(commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan di database');
    }
  }

  async verifyCommentAccess({ commentId, owner }) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1 and owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('anda tidak berhak mengakses komentar tersebut');
    }
  }

  async deleteComment(commentId) {
    const updatedIsDelete = true;

    const query = {
      text: 'UPDATE comments SET is_delete = $1 WHERE id = $2',
      values: [updatedIsDelete, commentId],
    };

    await this._pool.query(query);
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: 'SELECT c.id, u.username, c.created_at as date, '
      + "CASE WHEN c.is_delete THEN '**komentar telah dihapus**' ELSE c.content "
      + 'END as content '
      + 'FROM comments as c '
      + 'LEFT JOIN users as u ON u.id = c.owner '
      + 'WHERE thread_id = $1 '
      + 'ORDER BY created_at ASC',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      return [];
    }

    return result.rows.map((row) => new DetailComment(row));
  }
}

module.exports = CommentRepositoryPostgres;
