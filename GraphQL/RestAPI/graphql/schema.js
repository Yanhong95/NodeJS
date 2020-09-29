const { buildSchema } = require('graphql');

module.exports = buildSchema(`

    type Post {
      _id: ID!
      title: String!
      content: String!
      imageUrl: String!
      creator: User!
      createdAt: String!
      updatedAt: String!
    }

    type User {
      _id: ID!
      name: String!
      email: String!
      password: String
      status: String!
      posts: [Post!]
    }

    type AuthData {
      token: String!
      userId: String!
    }

    type PostData {
      posts: [Post!]!
      postCount: Int!
    }

    input SigninData {
      email: String!
      name: String!
      password: String!
    }

    input LoginData {
      email: String!
      password: String!
    }

    input CreatePostData {
      title: String!
      content: String!
      imageUrl: String!
    }

    input GetPosts {
      page: Int!
    }

    type RootQuert {
      login(userInput: LoginData): AuthData!
      getPosts(userInput: GetPosts): PostData!
      getPost(id: ID!):Post!
      getUser: User!
    }

    type RootMutation {
      createUser(userInput: SigninData): User!
      createPost(userInput: CreatePostData): Post!
      updatePost(id: ID!, userInput: CreatePostData): Post!
      deletePost(id: ID!): Boolean
      updateStatus(status: String!): User!
    }

    schema {
      query: RootQuert 
      mutation: RootMutation
    }
`);