const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    let token;

    // Check if token exists in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded.id;
      next();
    } else {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

  } catch (error) {
    return res.status(401).json({ message: "Token failed" });
  }
};

module.exports = protect;