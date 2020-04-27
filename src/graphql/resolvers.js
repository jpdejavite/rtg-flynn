const { ApolloError } = require('apollo-server');
const jwt = require('jsonwebtoken');

const { Crypto } = require('../crypto/Crypto');
const { Config, ConfigKeys } = require('../config/Config');


const resolvers = {
  Query: {
    app: (_, args) => args,
    backoffice: (_, args) => args,
    service: (_, args) => args,
  },
  Mutation: {
    app: (_, args) => args,
    backoffice: (_, args) => args,
    service: (_, args) => args,
  },
  AppQueries: {
    id: () => 'AppQueries',
    user: (_, args) => args,
  },
  AppMutations: {
    id: () => 'AppMutations',
    user: (_, args) => args,
  },
  BackofficeQueries: {
    id: () => 'BackOfficeQueries',
  },
  BackofficeMutations: {
    id: () => 'BackofficeMutations',
  },
  ServiceQueries: {
    id: () => 'ServiceQueries',
  },
  ServiceMutations: {
    id: () => 'ServiceMutations',
    user: (_, args) => args,
  },
  UserAppMutations: {
    refreshSession(_, { refreshToken }) {
      return { id: 'jp', token: 'AAAAA', refreshToken };
    },
  },
  UserServiceMutations: {
    login: async (_, { username, pass }, context) => {
      const appDb = context.appDb.firestore();

      const email = username.trim();
      const userByEmailDoc = await appDb.collection('userByEmail').doc(email).get();
      if (!userByEmailDoc || !userByEmailDoc.data()) {
        throw new ApolloError('User not found', 'user_not_found');
      }

      const userDoc = await appDb.collection('users').doc(userByEmailDoc.data().userId).get();
      if (!userDoc || !userDoc.data()) {
        throw new ApolloError('User not found', 'user_not_found');
      }

      const userData = userDoc.data();
      const password = Crypto.passwordHash(pass, userData.passSalt);
      if (password !== userData.password) {
        throw new ApolloError('Wrong password', 'wrong_password');
      }

      const secret = Config.get(ConfigKeys.SECRET).replace(/\\n/gi, '\n');
      const payload = { iss: 'flynn', roles: ['user'], uid: userDoc.id };
      const token = jwt.sign(payload, secret, { algorithm: Config.get(ConfigKeys.SIGN_ALGORITHM) });
      return {
        id: userDoc.id,
        token,
        refreshToken: userData.refreshToken,
      };
    },
    create: async (_, { username, pass }, context) => {
      const appDb = context.appDb.firestore();

      const email = username.trim();
      let userByEmailDoc = await appDb.collection('userByEmail').doc(email).get();
      if (userByEmailDoc && userByEmailDoc.data()) {
        throw new ApolloError('Email already registered', 'email_already_registred');
      }

      const userDoc = appDb.collection('users').doc();
      const passSalt = Crypto.randomString(16);
      const password = Crypto.passwordHash(pass, passSalt);
      // eslint-disable-next-line max-len
      const refreshToken = `${Crypto.randomString(32)}-${Crypto.randomString(32)}-${Crypto.randomString(32)}-${Crypto.randomString(32)}`;
      await userDoc.set({
        createdAt: new Date().toJSON(),
        email,
        password,
        passSalt,
        refreshToken,
        roles: ['user'],
      });
      userByEmailDoc = appDb.collection('userByEmail').doc(email);
      userByEmailDoc.set({
        createdAt: new Date().toJSON(),
        userId: userDoc.id,
      });

      const secret = Config.get(ConfigKeys.SECRET).replace(/\\n/gi, '\n');
      const payload = { iss: 'flynn', roles: ['user'], uid: userDoc.id };
      const token = jwt.sign(payload, secret, { algorithm: Config.get(ConfigKeys.SIGN_ALGORITHM) });
      return {
        id: userDoc.id,
        token,
        refreshToken,
      };
    },
  },
  UserAppQueries: {
    data: async (_, _1, context) => {
      const appDb = context.appDb.firestore();
      const userDoc = await appDb.collection('users').doc(context.authorizationData.uid).get();
      if (!userDoc || !userDoc.data()) {
        throw new ApolloError('User not found', 'user_not_found');
      }

      const userData = userDoc.data();
      return {
        id: userDoc.id,
        email: userData.email,
      };
    },
  },
};

module.exports = { resolvers };
