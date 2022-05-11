class DeleteCommentUseCase {
  constructor({
    commentRepository,
    threadRepository,
    commentLikeRepository,
  }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
    this._commentLikeRepository = commentLikeRepository;
  }

  async execute(useCasePayload) {
    const { commentId, threadId, owner } = useCasePayload;

    await this._threadRepository.checkAvailabilityThread(threadId);
    await this._commentRepository.checkAvailabilityComment(commentId);

    const commentLikeAvailable = await this._commentLikeRepository.checkAvailabilityCommentLike({
      commentId, owner,
    });

    if (commentLikeAvailable) {
      await this._commentLikeRepository.deleteCommentLike({
        commentId, owner,
      });
    } else {
      await this._commentLikeRepository.addCommentLike({
        commentId, owner,
      });
    }
  }
}

module.exports = DeleteCommentUseCase;
