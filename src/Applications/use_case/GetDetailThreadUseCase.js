const DetailComment = require('../../Domains/comments/entities/DetailComment');
const DetailReply = require('../../Domains/replies/entities/DetailReply');
const DetailThread = require('../../Domains/threads/entities/DetailThread');

class GetDetailThreadUseCase {
  constructor({
    threadRepository,
    commentRepository,
    replyRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;

    await this._threadRepository.checkAvailabilityThread(threadId);

    const detailThread = await this._threadRepository.getThreadById(threadId);
    let comments = await this._commentRepository.getCommentsByThreadId(threadId);

    comments = await Promise.all(comments.map(async (comment) => {
      let replies = await this._replyRepository.getRepliesByCommentId(comment.id);

      replies = replies.map((reply) => new DetailReply(reply));

      return {
        ...comment,
        replies,
      };
    }));

    return new DetailThread({
      ...detailThread,
      comments: comments.map((comment) => new DetailComment(comment)),
    });
  }
}

module.exports = GetDetailThreadUseCase;
