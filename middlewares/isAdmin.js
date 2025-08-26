// middlewares/isAdmin.js
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
  const requester = String(req.user.email).toLowerCase();

  if (requester === ADMIN_EMAIL) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: admins only" });
};

export default isAdmin;
