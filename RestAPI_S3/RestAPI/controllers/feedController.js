const fs = require('fs');
const path = require('path');
const io = require('../socket');

const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find().populate('creator').sort({ createAt: -1 }).skip((currentPage - 1) * perPage).limit(perPage);
    })
    .then(posts => {
      res.status(200).json({ messgae: 'Fetched posts successfully.', posts: posts, totalItems: totalItems });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = async (req, res, next) => {
  // create post in database
  const errors = validationResult(req);
  // if the input data doesn't meet the requirements, an error message is returnted.
  if (!errors.isEmpty()) {
    // 因为这个是sync方法, 这个trow error会直接进入到下一个middleware
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
    // return res.status(422).json({
    //   message: 'Validation faild, entered data is incorrect.',
    //   errors: errors.array()
    // });
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  try {
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    // 或者 根据此用户信息来新建post 然后存creater信息.
    const post = new Post({
      // _id: new Date().toISOString(), mongoose自动创建
      // createdAt: new Date() mongoose自动创建
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: req.userId
    });
    await post.save()
    // 找到通过token认证的用户.
    const user = await User.findById(req.userId);
    // 将post放入用户
    user.posts.push(post);
    await user.save();
    // status 201 => succeed and created 

    // broadcast 会传送给所有用户(除了接下来req要sent的用户)
    // io.getIO().broadcast('posts', {action: 'create', post: post })
    // emit 会传送给所有当前连接的用户.
    io.getIO().emit('posts', {
      action: 'create', 
      post: { ...post._doc, creator: {_id: req.userId, name: user.name }} 
    });

    res.status(201).json({
      message: 'Post created successully!',
      post: post,
      creator: { _id: user._id, name: user.name }
    });
  } catch (err) {
    // 因为这个是async方法, 这个trow error会需要放进next()里才能进入到下一个middleware
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}


exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched', post: post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.updatePost = (req, res, next) => {
  console.log('1', req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId).populate('creator')
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      if (post.imageUrl !== imageUrl) {
        clearImage(post.imageUrl);
      }
      console.log('2', imageUrl);
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then(result => {
      io.getIO().emit('posts', { action: 'update', post: result });
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.deletePost2 = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      // check logged in user
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Deleted post.' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    // check logged in user
    clearImage(post.imageUrl);
    const result = await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    user.save();
    io.getIO().emit('posts', { action: 'delete', post: postId});
    res.status(200).json({ message: 'Deleted post.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};