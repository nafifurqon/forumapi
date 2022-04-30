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
      const validatedComment = this._validateContent({ ...comment }, 'comment');

      let replies = await this._replyRepository.getRepliesByCommentId(comment.id);

      replies = replies.map((reply) => {
        const validatedReply = this._validateContent({ ...reply }, 'reply');

        return new DetailReply(validatedReply);
      });

      return {
        ...validatedComment,
        replies,
      };
    }));

    return new DetailThread({
      ...detailThread,
      comments: comments.map((comment) => new DetailComment(comment)),
    });
  }

  _validateContent(item, type = 'comment') {
    const validatedItem = { ...item };

    if (validatedItem.is_delete === true) {
      validatedItem.content = this._changeDeletedContent(type);
    }

    return validatedItem;
  }

  _changeDeletedContent(type = 'comment') {
    switch (type) {
      case 'reply':
        return '**balasan telah dihapus**';
      default:
        return '**komentar telah dihapus**';
    }
  }
}

module.exports = GetDetailThreadUseCase;
