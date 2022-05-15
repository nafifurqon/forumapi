const LikeCommentToggleUseCase = require('../../../../Applications/use_case/LikeCommentToggleUseCase');

class CommentLikesHandler {
  constructor(container) {
    this._container = container;

    this.putCommentLikeHandler = this.putCommentLikeHandler.bind(this);
  }

  async putCommentLikeHandler(request) {
    const { threadId, commentId } = request.params;
    const { id: owner } = request.auth.credentials;

    const likeCommentToggleUseCase
      = this._container.getInstance(LikeCommentToggleUseCase.name);
    await likeCommentToggleUseCase.execute({
      threadId, commentId, owner,
    });

    return {
      status: 'success',
    };
  }
}

module.exports = CommentLikesHandler;
