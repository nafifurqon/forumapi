const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const CommentLikeRepository = require('../../../Domains/comment_likes/CommentLikeRepository');
const LikeCommentToggleUseCase = require('../LikeCommentToggleUseCase');

describe('LikeCommentToggleUseCase', () => {
  it('should orchestrating the like comment if comment like not available', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingCommentLikeRepository = new CommentLikeRepository();

    mockingThreadRepository.checkThreadAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.checkCommentAvailability = jest.fn(() => Promise.resolve());
    mockingCommentLikeRepository.checkCommentAvailabilityLike
      = jest.fn(() => Promise.resolve(false));
    mockingCommentLikeRepository.addCommentLike = jest.fn(() => Promise.resolve({
      id: 'comment-like-123',
      commentId: 'comment-123',
      owner: 'user-123',
    }));
    mockingCommentLikeRepository.deleteCommentLike = jest.fn(() => Promise.resolve());

    const likeCommentToggleUseCase = new LikeCommentToggleUseCase({
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
      commentLikeRepository: mockingCommentLikeRepository,
    });

    // Action
    await likeCommentToggleUseCase.execute(useCasePayload);

    // Assert
    expect(mockingThreadRepository.checkThreadAvailability)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.checkCommentAvailability)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockingCommentLikeRepository.checkCommentAvailabilityLike)
      .toBeCalledWith({
        commentId: useCasePayload.commentId,
        owner: useCasePayload.owner,
      });
    expect(mockingCommentLikeRepository.addCommentLike)
      .toBeCalledWith({
        commentId: useCasePayload.commentId,
        owner: useCasePayload.owner,
      });
    expect(mockingCommentLikeRepository.deleteCommentLike)
      .not.toBeCalled();
  });

  it('should orchestrating the dislike comment if comment like available', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingCommentLikeRepository = new CommentLikeRepository();

    mockingThreadRepository.checkThreadAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.checkCommentAvailability = jest.fn(() => Promise.resolve());
    mockingCommentLikeRepository.checkCommentAvailabilityLike
      = jest.fn(() => Promise.resolve(true));
    mockingCommentLikeRepository.addCommentLike = jest.fn(() => Promise.resolve({
      id: 'comment-like-123',
      commentId: 'comment-123',
      owner: 'user-123',
    }));
    mockingCommentLikeRepository.deleteCommentLike = jest.fn(() => Promise.resolve());

    const likeCommentToggleUseCase = new LikeCommentToggleUseCase({
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
      commentLikeRepository: mockingCommentLikeRepository,
    });

    // Action
    await likeCommentToggleUseCase.execute(useCasePayload);

    // Assert
    expect(mockingThreadRepository.checkThreadAvailability)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.checkCommentAvailability)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockingCommentLikeRepository.checkCommentAvailabilityLike)
      .toBeCalledWith({
        commentId: useCasePayload.commentId,
        owner: useCasePayload.owner,
      });
    expect(mockingCommentLikeRepository.deleteCommentLike)
      .toBeCalledWith({
        commentId: useCasePayload.commentId,
        owner: useCasePayload.owner,
      });
    expect(mockingCommentLikeRepository.addCommentLike)
      .not.toBeCalled();
  });
});
