const LikeOrDislikeCommentUseCase = require('../../../../Applications/use_case/LikeOrDislikeCommentUseCase');

class CommentLikesHandler {
  constructor(container) {
    this._container = container;

    this.putCommentLikeHandler = this.putCommentLikeHandler.bind(this);
  }

  async putCommentLikeHandler(request) {
    const { threadId, commentId } = request.params;
    const { id: owner } = request.auth.credentials;

    const likeOrDislikeCommentUseCase
      = this._container.getInstance(LikeOrDislikeCommentUseCase.name);
    await likeOrDislikeCommentUseCase.execute({
      threadId, commentId, owner,
    });

    return {
      status: 'success',
    };
  }
}

module.exports = CommentLikesHandler;
