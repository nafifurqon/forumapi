class DetailReply {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, username, date, content, is_delete: isDelete,
    } = payload;

    this.id = id;
    this.username = username;
    this.date = date;
    this.content = isDelete ? '**balasan telah dihapus**' : content;
  }

  _verifyPayload(payload) {
    const {
      id, username, date, content,
    } = payload;

    if (!id || !username || !date || !content) {
      throw new Error('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof date !== 'string'
      || typeof content !== 'string'
    ) {
      throw new Error('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailReply;
