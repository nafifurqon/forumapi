const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');

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
    const createdAt = now;
    const updatedAt = now;

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner',
      values: [id, content, threadId, owner, isDelete, createdAt, updatedAt],
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

    if (result.rows.length === 0) {
      throw new NotFoundError('komentar tidak ditemukan di database');
    }
  }

  async verifyCommentAccess({ commentId, owner }) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1 and owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new AuthorizationError('anda tidak berhak mengakses komentar tersebut');
    }
  }

  async deleteComment(commentid) {
    const updatedIsDelete = true;
    const updatedContent = '**komentar telah dihapus**';

    const query = {
      text: 'UPDATE comments SET is_delete = $1, content = $2 '
      + 'WHERE id = $3',
      values: [updatedIsDelete, updatedContent, commentid],
    };

    const result = await this._pool.query(query);
  }
}

module.exports = CommentRepositoryPostgres;
