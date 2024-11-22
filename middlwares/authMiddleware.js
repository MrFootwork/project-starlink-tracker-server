export const authMiddleware = (req, res, next) => {
  res.header('X-Hello', 'World')
  console.log('checking auth');
  next()
}