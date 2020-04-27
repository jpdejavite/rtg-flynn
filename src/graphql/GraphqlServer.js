const { ApolloServer, ApolloError } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');
const { attachDirectiveResolvers } = require('graphql-tools');
const jwt = require('jsonwebtoken');

const { typeDefs } = require('./typeDefs');
const { resolvers } = require('./resolvers');
const { directiveResolvers } = require('./directiveResolvers');

const { GlobalConfig, GlobalConfigKeys } = require('../config/GlobalConfig');

const buildGraphqlServer = (db) => {
  const schema = buildFederatedSchema([
    {
      typeDefs,
      resolvers,
    },
  ]);
  attachDirectiveResolvers(
    schema,
    directiveResolvers,
  );

  const GraphqlServer = new ApolloServer({
    schema,
    context: async (context) => {
      const { req } = context;
      if (!req || !req.headers || !req.headers['gateway-token']) {
        throw new ApolloError('Invalid request', 'invalid_request');
      }

      try {
        const publicKey = GlobalConfig.get(GlobalConfigKeys.GATEWAY_PUBLIC_KEY).replace(/\\n/gi, '\n');
        const gatewayPayload = jwt.verify(req.headers['gateway-token'], publicKey);

        const now = new Date().getTime();
        const expirationTimeInMillis = GlobalConfig.get(GlobalConfigKeys.TOKEN_EXPIRATION_IN_MINUTES) * 60 * 1000;
        if (now - (gatewayPayload.iat || 0) * 1000 > expirationTimeInMillis) {
          throw new ApolloError('Token expired', 'token_expired');
        }
        return Object.assign(context, { authorizationData: gatewayPayload, appDb: db.getFlynn() });
      } catch (e) {
        console.log(e);
      }
      throw new ApolloError('Invalid request', 'invalid_request');
    },
  });
  return GraphqlServer;
};

module.exports = { buildGraphqlServer };
