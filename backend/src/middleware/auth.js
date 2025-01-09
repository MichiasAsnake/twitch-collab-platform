export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Auth header:', req.headers.authorization);
  console.log('Extracted token:', token);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  req.token = token;
  next();
}; 