/**
 * Middleware to restrict access based on admin role
 * @param  {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
};

export default requireRole;
