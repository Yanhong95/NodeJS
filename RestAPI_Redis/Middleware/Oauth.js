const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('143128443691-2php9cqdt9vg54adrv8semue680hnkte.apps.googleusercontent.com'); // CLIENT_ID

module.exports = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    return next(error);
  }
  const token = authHeader.split(' ')[1];
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '143128443691-2php9cqdt9vg54adrv8semue680hnkte.apps.googleusercontent.com'
    });
    const payload = ticket.getPayload();
    if (!payload) {
      const error = new Error(`Authentication failed.  ${err}`);
      error.statusCode = 401;
      return next(error);
    }
    req.userId = payload['sub'];
  } catch (err) {
    const error = new Error( `Authentication failed.  ${err}`);
    error.statusCode = 500;
    return next(error);
  }  
  next();
}
