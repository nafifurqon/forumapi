class DeleteReplyUseCase {
  constructor({
    replyRepository,
    commentRepository,
    threadRepository,
  }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const {
      threadId, commentId, replyId, owner,
    } = useCasePayload;

    await this._threadRepository.checkAvailabilityThread(threadId);
    await this._commentRepository.checkAvailabilityComment(commentId);

    await this._replyRepository.checkAvailabilityReply(replyId);
    await this._replyRepository.verifyReplyAccess({ replyId, owner });
    await this._replyRepository.deleteReply(replyId);
  }
}

module.exports = DeleteReplyUseCase;
