exports.getPosts = (req, res, next) => {
    res.status(200).json({
      post: [{title: 'First post', content:'This is the first post!'}]
    });
};

exports.createPost = (req, res, next) => {
   // create post in database
   const title = req.body.title;
   const content = req.body.content;
   // status 201 => succeed and created 
   res.status(201).json({
     message: 'Post created successully!',
     post: {
       id: new Date().toISOString(),
       title: title,
       content: content
     }
   });
}