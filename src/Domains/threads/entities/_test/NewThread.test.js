const NewThread = require('../NewThread');

describe('a NewThread entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      title: 'Judul',
      body: 'Body',
    };

    // Action & Assert
    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      title: 'Judul',
      body: 123,
      owner: true,
    };

    // Action & Assert
    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create newThread object correctly', () => {
    // Arrange
    const payload = {
      title: 'Judul',
      body: 'Ini adalah salah satu contoh body.',
      owner: 'user-123',
    };

    // Action
    const { title, body } = new NewThread(payload);

    // Assert
    expect(title).toEqual(payload.title);
    expect(body).toEqual(payload.body);
  });
});
