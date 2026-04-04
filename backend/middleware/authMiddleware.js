import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  const decoded = jwt.verify(token, "secretkey");
  req.user = decoded;

  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user.role === "admin") next();
  else res.status(403).json({ message: "Admin only" });
};