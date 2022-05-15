const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');

describe('DeleteReplyUseCase', () => {
  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingReplyRepository = new ReplyRepository();

    mockingThreadRepository.checkThreadAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.checkCommentAvailability = jest.fn(() => Promise.resolve());
    mockingReplyRepository.checkReplyAvailability = jest.fn(() => Promise.resolve());
    mockingReplyRepository.verifyReplyAccess = jest.fn(() => Promise.resolve());
    mockingReplyRepository.deleteReply = jest.fn(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockingReplyRepository,
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
    });

    await deleteReplyUseCase.execute(useCasePayload);

    // Assert
    expect(mockingThreadRepository.checkThreadAvailability)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.checkCommentAvailability)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockingReplyRepository.checkReplyAvailability)
      .toBeCalledWith(useCasePayload.replyId);
    expect(mockingReplyRepository.verifyReplyAccess)
      .toBeCalledWith({
        replyId: useCasePayload.replyId, owner: useCasePayload.owner,
      });
    expect(mockingReplyRepository.deleteReply)
      .toBeCalledWith(useCasePayload.replyId);
  });
});
