const isAdmin = (req, res, next) => {
  res.status(200).json({ message: "is admin" });
  next();
};

export default isAdmin;
