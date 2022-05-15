const AddReplyUseCase = require('../AddReplyUseCase');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');

describe('AddReplyUseCase', () => {
  it('should orchestrating the add reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Balasan',
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const expectedAddedReply = {
      id: 'reply-123',
      content: 'Balasan',
      owner: 'user-123',
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingReplyRepository = new ReplyRepository();

    mockingThreadRepository.checkThreadAvailability = jest.fn(() => Promise.resolve());
    mockingCommentRepository.checkCommentAvailability = jest.fn(() => Promise.resolve());
    mockingReplyRepository.addReply = jest.fn(() => Promise.resolve({
      id: 'reply-123',
      content: 'Balasan',
      owner: 'user-123',
    }));

    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockingReplyRepository,
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository,
    });

    // Action
    const addedReply = await addReplyUseCase.execute(useCasePayload);

    // Assert
    expect(addedReply).toStrictEqual(expectedAddedReply);
    expect(mockingThreadRepository.checkThreadAvailability)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.checkCommentAvailability)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockingReplyRepository.addReply).toBeCalledWith(new NewReply({
      content: useCasePayload.content,
      commentId: useCasePayload.commentId,
      owner: useCasePayload.owner,
    }));
  });
});
