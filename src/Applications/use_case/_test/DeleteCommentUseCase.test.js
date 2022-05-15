const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
  it('should throw error if use case payload did not contain needed property', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      owner: 'user-123',
    };
    const deleteCommentUseCase = new DeleteCommentUseCase({});

    // Action & Assert
    await expect(deleteCommentUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error if use case payload did not meet data type specification', async () => {
    // Arrange
    const useCasePayload = {
      commentId: 'comment-123',
      threadId: 12345,
      owner: true,
    };
    const deleteCommentUseCase = new DeleteCommentUseCase({});

    // Action & Assert
    await expect(deleteCommentUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('DELETE_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      commentId: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();

    mockingThreadRepository.checkThreadAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.checkCommentAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.verifyCommentAccess = jest.fn(() => Promise.resolve());
    mockingCommentRepository.deleteComment = jest.fn(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
    });

    // Action
    await deleteCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockingThreadRepository.checkThreadAvailability)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.checkCommentAvailability)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockingCommentRepository.verifyCommentAccess)
      .toBeCalledWith({
        commentId: useCasePayload.commentId, owner: useCasePayload.owner,
      });
    expect(mockingCommentRepository.deleteComment)
      .toBeCalledWith(useCasePayload.commentId);
  });
});
