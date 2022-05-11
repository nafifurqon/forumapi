const routes = require('./routes');
const CommentLikesHandler = require('./handler');

module.exports = {
  name: 'commentLikes',
  register: async (server, { container }) => {
    const commentLikesHandler = new CommentLikesHandler(container);
    server.route(routes(commentLikesHandler));
  },
};
