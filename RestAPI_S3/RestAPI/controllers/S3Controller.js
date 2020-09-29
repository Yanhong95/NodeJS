const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const Post = require('../models/post');
require('dotenv').config();

var s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

exports.getSignedUrl = (req, res, next) => {
  try {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const params = {
      Bucket: req.query.uploadS3Bucket,
      Key: `${req.query.uploadPath}/${req.userId}-${req.query.filename}`,
      ContentType: req.query.type
    };
    s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
        console.log('error', err);
      } else {
        return res.status(200).json({ signedUrl: url, imageName:`${req.userId}-${req.query.filename}`});
      }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getS3Object = async (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error('Not authenticated!');
    error.code = 401;
    throw error;
  }
  try {
    const post = await Post.findById(req.query.postId);
    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    const imageUrl = post.imageUrl;
    const imageName = imageUrl.split("/").pop();
    const params = {
      Bucket: "restpostproject", 
      Key: `postImage/${imageName}`
     };
     data = await s3.getObject(params).promise();
     let tempPath = path.join(__dirname, '../images', imageName);
     fs.writeFileSync(tempPath, data.Body);
     res.setHeader('Content-Length', data.ContentLength);
     res.setHeader('Content-Type', mime.contentType(imageName));
     res.setHeader('Content-Disposition', 'attachment; filename="' + imageName + '"');
     var filestream = fs.createReadStream(tempPath);
     filestream.pipe(res);
     fs.unlinkSync(tempPath);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.deleteImage = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(req.params.objectId);
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
       } else {
        return res.status(200).json({ message : 'deletion successful!'});          // successful response
       }     
     });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}