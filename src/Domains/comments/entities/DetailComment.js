class DetailComment {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, username, date, content, replies, is_delete: isDelete, like_count: likeCount,
    } = payload;

    this.id = id;
    this.username = username;
    this.date = date;
    this.content = isDelete ? '**komentar telah dihapus**' : content;
    this.replies = replies;
    this.likeCount = likeCount;
  }

  _verifyPayload(payload) {
    const {
      id, username, date, content, replies, is_delete: isDelete, like_count: likeCount,
    } = payload;

    if (!id || !username || !date || !content || isDelete === undefined) {
      throw new Error('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof date !== 'string'
      || typeof isDelete !== 'boolean'
      || typeof content !== 'string'
      || (likeCount && typeof likeCount !== 'number')
      || (replies && !Array.isArray(replies))
    ) {
      throw new Error('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailComment;
