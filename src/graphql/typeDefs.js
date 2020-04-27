const { gql } = require('apollo-server');

const typeDefs = gql`
  directive @hasAllRoles (roles: [String]) on FIELD | FIELD_DEFINITION

  extend type Query {
    app: AppQueries                     @hasAllRoles (roles: ["user"])
    backoffice: BackofficeQueries       @hasAllRoles (roles: ["admin"])
    service: ServiceQueries             @hasAllRoles (roles: ["service"])
  }

  extend type Mutation {
    app: AppMutations                     @hasAllRoles (roles: ["user"])
    backoffice: BackofficeMutations       @hasAllRoles (roles: ["admin"])
    service: ServiceMutations             @hasAllRoles (roles: ["service"])
  }

  type AppQueries @key(fields: "id") {
    id: ID!
  }

  type AppMutations @key(fields: "id") {
    id: ID!
  }

  type BackofficeQueries @key(fields: "id") {
    id: ID!
  }

  type BackofficeMutations @key(fields: "id") {
    id: ID!
  }

  type ServiceQueries @key(fields: "id") {
    id: ID!
  }

  type ServiceMutations @key(fields: "id") {
    id: ID!
  }

  extend type AppQueries @key(fields: "id") {
    user: UserAppQueries!
  }

  extend type AppMutations @key(fields: "id") {
    user: UserAppMutations
  }

  extend type ServiceMutations @key(fields: "id") {
    user: UserServiceMutations
  }

  type UserAppMutations {
    refreshSession(refreshToken: String!): AuthenticationData! @hasAllRoles (roles: ["user"])
  }

  type UserServiceMutations {
    login(username: String!, pass: String!): AuthenticationData! @hasAllRoles (roles: ["frontend"])
    create(username: String!, pass: String!): AuthenticationData! @hasAllRoles (roles: ["frontend"])
  }

  type AuthenticationData @key(fields: "id") {
    id: ID!
    token: String!
    refreshToken: String!
  }

  type UserAppQueries {
    data: User
  }

  type User @key(fields: "id") {
    id: ID!
    email: String!
  }
`;

module.exports = { typeDefs };
