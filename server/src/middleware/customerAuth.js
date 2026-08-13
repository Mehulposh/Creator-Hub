import jwt from 'jsonwebtoken';

export function requireCustomerAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Please sign in to access your library.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'customer' || !payload.email) {
      return res.status(403).json({ message: 'Customer access only.' });
    }
    req.customerEmail = payload.email.toLowerCase();
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export function customerTokenFor(email) {
  return jwt.sign(
    { email: email.toLowerCase(), role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}
