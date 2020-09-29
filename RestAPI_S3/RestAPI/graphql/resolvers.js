const User = require('../models/user');
const Post = require('../models/post');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
require('dotenv').config();

var s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const { login } = require('../controllers/authController');

module.exports = {
  async createUser({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'E-Mail is invalid.' });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  async login({ userInput }, req) {
    const email = userInput.email;
    const password = userInput.password;
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('user not found.');
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect.');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      'somesupersecretsecret',
      { expiresIn: '1h' }
    );
    return { token: token, userId: user._id.toString() };
  },

  async createPost({ userInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(userInput.title) ||
      !validator.isLength(userInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid!' });
    }
    if (
      validator.isEmpty(userInput.content) ||
      !validator.isLength(userInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid!' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user.');
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: userInput.title,
      content: userInput.content,
      imageUrl: userInput.imageUrl,
      creator: user
    });
    const createPost = await post.save();
    user.posts.push(createPost);
    await user.save();
    return {
      ...createPost._doc,
      _id: createPost._id.toString(),
      createdAt: createPost.createdAt.toISOString(),
      updatedAt: createPost.updatedAt.toISOString()
    }
  },

  async getPosts(args, req) {
    const page = args.userInput.page || 1;
    const perpage = 2
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const postCount = await Post.find().countDocuments();
    const posts = await Post.find().skip((page - 1) * perpage).limit(perpage).sort({ createdAt: -1 }).populate('creator');
    return {
      posts: posts.map(p => {
        return { ...p._doc, _id: p._id.toString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }
      }), postCount: postCount
    }
  },

  async getPost({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('Unable to find this post.');
      error.code = 404;
      throw error;
    }
    return { ...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() };
  },

  async updatePost({ id, userInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized!');
      error.code = 403;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(userInput.title) ||
      !validator.isLength(userInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }
    if (
      validator.isEmpty(userInput.content) ||
      !validator.isLength(userInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    post.title = userInput.title;
    post.content = userInput.content;
    if (userInput.imageUrl !== 'undefined') {
      post.imageUrl = userInput.imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },


  async deletePost({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized!');
      error.code = 403;
      throw error;
    }
    const imageUrl = post.imageUrl;
    const imageName = imageUrl.split("/").pop();
    const params = {
      Bucket: "restpostproject", 
      Key: `postImage/${imageName}`
     };
    s3.deleteObject(params, (err, data) => {
       if (err) {
        console.log(err, err.stack);
        const error = new Error('deletion failed!' + err);
        error.code = 404;
        throw error;
       }   
     });
     await Post.findByIdAndRemove(id);
     const user = await User.findById(req.userId);
     user.posts.pull(id);
     await user.save();
     return true;  
    // filePath = path.join(__dirname, '..', post.imageUrl);
    // fs.unlink(filePath, err => console.log(err));
  },


  async getUser(args, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found!');
      error.code = 404;
      throw error;
    }
    return { ...user._doc, _id: user._id.toString() };
  },
  
  
  async updateStatus({ status }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found!');
      error.code = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    return { ...user._doc, _id: user._id.toString() };
  }
}