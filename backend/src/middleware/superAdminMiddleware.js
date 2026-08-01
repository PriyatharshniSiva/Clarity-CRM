/**
 * Security middleware enforcing SUPER_ADMIN role authorization.
 * Returns HTTP 403 Forbidden if user is not a SUPER_ADMIN.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      message: 'Forbidden: Super Admin access required. Access to Platform Administration is restricted.'
    });
  }

  next();
};

module.exports = {
  requireSuperAdmin
};
