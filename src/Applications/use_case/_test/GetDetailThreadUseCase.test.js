const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const GetDetailThreadUseCase = require('../GetDetailThreadUseCase');

describe('GetDetailThreadUseCase', () => {
  it('should orchestrating the get detail thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
    };

    const expectedDetailThread = {
      id: 'thread-h_2FkLZhtgBKY2kh4CC02',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-_pby2_tmXV6bcvcdev8xk',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
        },
      ],
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();

    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockingThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'thread-h_2FkLZhtgBKY2kh4CC02',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      }));
    mockingCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'comment-_pby2_tmXV6bcvcdev8xk',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
        },
      ]));

    const getDetailThreadUseCase = new GetDetailThreadUseCase({
      threadRepository: mockingThreadRepository,
      commentRepository: mockingCommentRepository,
    });

    // Action
    const detailThread = await getDetailThreadUseCase.execute(useCasePayload);

    // Assert
    expect(detailThread).toEqual(expectedDetailThread);
    expect(mockingThreadRepository.checkAvailabilityThread)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingThreadRepository.getThreadById)
      .toBeCalledWith(useCasePayload.threadId);
    expect(mockingCommentRepository.getCommentsByThreadId)
      .toBeCalledWith(useCasePayload.threadId);
  });
});
