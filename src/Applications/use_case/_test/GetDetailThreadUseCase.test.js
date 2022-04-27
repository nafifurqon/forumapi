const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
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
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          replies: [
            {
              id: 'reply-xNBtm9HPR-492AeiimpfN',
              content: 'sebuah balasan',
              date: '2021-08-08T08:07:01.522Z',
              username: 'dicoding',
            },
          ],
        },
      ],
    };

    const mockingThreadRepository = new ThreadRepository();
    const mockingCommentRepository = new CommentRepository();
    const mockingReplyRepository = new ReplyRepository();

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
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
        },
      ]));
    mockingReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'reply-xNBtm9HPR-492AeiimpfN',
          content: 'sebuah balasan',
          date: '2021-08-08T08:07:01.522Z',
          username: 'dicoding',
        },
      ]));

    const getDetailThreadUseCase = new GetDetailThreadUseCase({
      threadRepository: mockingThreadRepository,
      commentRepository: mockingCommentRepository,
      replyRepository: mockingReplyRepository,
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
    expect(mockingReplyRepository.getRepliesByCommentId)
      .toBeCalledWith(expectedDetailThread.comments[0].id);
  });
});
