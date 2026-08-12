export function requireCreator(req, res, next) {
  if (req.auth?.role === 'admin') return res.status(403).json({ message: 'Admin accounts can only use the admin dashboard' });
  next();
}
