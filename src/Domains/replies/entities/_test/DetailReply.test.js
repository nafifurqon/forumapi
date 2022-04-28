const DetailReply = require('../DetailReply');

describe('a DetailReply entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-xNBtm9HPR-492AeiimpfN',
      content: 'sebuah balasan',
      date: '2021-08-08T08:07:01.522Z',
    };

    // Action & Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 12345,
      username: true,
      date: '2021-08-08T08:07:01.522Z',
      content: 12345,
    };

    // Action & Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailReply object correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-xNBtm9HPR-492AeiimpfN',
      content: 'sebuah balasan',
      date: '2021-08-08T08:07:01.522Z',
      username: 'dicoding',
    };

    // Action
    const {
      id, username, date, content,
    } = new DetailReply(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(username).toEqual(payload.username);
    expect(date).toEqual(payload.date);
    expect(content).toEqual(payload.content);
  });
});
