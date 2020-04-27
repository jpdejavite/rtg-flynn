const { ApolloError } = require('apollo-server');

const directiveResolvers = {
  hasAllRoles(next, src, { roles }, context) {
    if (!context.authorizationData) {
      throw new ApolloError('Not authorized', 'not_authorized');
    }

    if (!context.authorizationData.roles) {
      throw new ApolloError('Not authorized', 'not_authorized');
    }

    for (let i = 0; i < roles.length; i += 1) {
      if (!context.authorizationData.roles.find((r) => r === roles[i])) {
        throw new ApolloError('Not authorized', 'not_authorized');
      }
    }

    return next();
  },
};

module.exports = { directiveResolvers };
