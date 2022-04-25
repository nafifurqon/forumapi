class DeleteCommentUseCase {
  constructor({
    commentRepository,
    threadRepository,
  }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);
    const { commentId, threadId, owner } = useCasePayload;

    await this._threadRepository.checkAvailabilityThread(threadId);

    await this._commentRepository.checkAvailabilityComment(commentId);
    await this._commentRepository.verifyCommentAccess({ commentId, owner });
    await this._commentRepository.deleteComment(commentId);
  }

  _verifyPayload(payload) {
    const { commentId, threadId, owner } = payload;

    if (!commentId || !threadId || !owner) {
      throw new Error('DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof commentId !== 'string' || typeof threadId !== 'string' || typeof owner !== 'string') {
      throw new Error('DELETE_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DeleteCommentUseCase;
