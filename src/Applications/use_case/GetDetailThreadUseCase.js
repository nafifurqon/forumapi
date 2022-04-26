const DetailThread = require('../../Domains/threads/entities/DetailThread');

class GetDetailThreadUseCase {
  constructor({
    threadRepository,
    commentRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;

    await this._threadRepository.checkAvailabilityThread(threadId);

    const detailThread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    return new DetailThread({
      ...detailThread,
      comments: [...comments],
    });
  }
}

module.exports = GetDetailThreadUseCase;
