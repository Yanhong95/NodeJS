const express = require('express');
const feedController = require('../controllers/feedController');
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');


const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth,
  [body('title').trim().isLength({ min: 3 }),
   body('content').trim().isLength({ min: 3 })], 
  feedController.createPost
  );

// GET /feed/post/:postId
router.get('/post/:postId', isAuth, feedController.getPost);

// PUT /feed/post/:postId
router.put('/post/:postId', isAuth,
  [body('title').trim().isLength({ min: 3 }),
  body('content').trim().isLength({ min: 3 })], 
  feedController.updatePost
  );

// DELETE /feed/post/:postId
router.delete('/post/:postId', isAuth, feedController.deletePost);


module.exports = router;