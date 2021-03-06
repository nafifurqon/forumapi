const DetailComment = require('../DetailComment');

describe('a DetailComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-_pby2_tmXV6bcvcdev8xk',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'komentar',
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 12345,
      username: true,
      date: 123,
      content: 12345,
      is_delete: 'test',
      like_count: 'dua',
      replies: 'balasan',
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detailComment object correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-_pby2_tmXV6bcvcdev8xk',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      is_delete: false,
      like_count: 2,
      replies: [],
    };

    // Action
    const {
      id, username, date, content, likeCount, replies,
    } = new DetailComment(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(username).toEqual(payload.username);
    expect(date).toEqual(payload.date);
    expect(content).toEqual(payload.content);
    expect(likeCount).toEqual(payload.like_count);
    expect(replies).toEqual([]);
  });

  it('should set content as "**komentar telah dihapus**" when is_delete is true', () => {
    // Arrange
    const payload = {
      id: 'comment-_pby2_tmXV6bcvcdev8xk',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      is_delete: true,
      replies: [],
    };

    // Action
    const { content } = new DetailComment(payload);

    // Assert
    expect(content).toEqual('**komentar telah dihapus**');
  });
});
