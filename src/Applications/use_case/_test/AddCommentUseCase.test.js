const AddCommentUseCase = require('../AddCommentUseCase');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');

describe('AddCommentUseCase', () => {
  it('should orchestrating the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Komentar',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    const expectedAddedComment = {
      id: 'comment-123',
      content: 'Komentar',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();

    mockingThreadRepository.checkThreadAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.addComment = jest.fn(() => Promise.resolve({
      id: 'comment-123',
      content: 'Komentar',
      owner: 'user-123',
    }));

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload);

    // Assert
    expect(addedComment).toStrictEqual(expectedAddedComment);
    expect(mockingThreadRepository.checkThreadAvailability)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.addComment).toBeCalledWith(new NewComment({
      content: useCasePayload.content,
      threadId: useCasePayload.threadId,
      owner: useCasePayload.owner,
    }));
  });
});
