const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');

describe('DeleteReplyUseCase', () => {
  it('should throw error when reply is not found', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'not-found-reply-id',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingReplyRepository = new ReplyRepository();

    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingCommentRepository.checkAvailabilityComment = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingReplyRepository.checkAvailabilityReply = jest.fn()
      .mockImplementation(() => Promise.reject(new Error('balasan tidak ditemukan di database')));
    mockingReplyRepository.verifyReplyAccess = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingReplyRepository.deleteReply = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockingReplyRepository,
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
    });

    // Assert
    await expect(deleteReplyUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('balasan tidak ditemukan di database');
  });

  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'not-found-reply-id',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingReplyRepository = new ReplyRepository();

    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingCommentRepository.checkAvailabilityComment = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingReplyRepository.checkAvailabilityReply = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingReplyRepository.verifyReplyAccess = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingReplyRepository.deleteReply = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockingReplyRepository,
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
    });

    await deleteReplyUseCase.execute(useCasePayload);

    // Assert
    expect(mockingThreadRepository.checkAvailabilityThread)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.checkAvailabilityComment)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockingReplyRepository.checkAvailabilityReply)
      .toBeCalledWith(useCasePayload.replyId);
    expect(mockingReplyRepository.verifyReplyAccess)
      .toBeCalledWith({
        replyId: useCasePayload.replyId, owner: useCasePayload.owner,
      });
    expect(mockingReplyRepository.deleteReply)
      .toBeCalledWith(useCasePayload.replyId);
  });
});
