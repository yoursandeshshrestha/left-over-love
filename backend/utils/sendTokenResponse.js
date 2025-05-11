const config = require("../config/config");

const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + parseInt(config.JWT_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Set secure flag in production
  if (config.NODE_ENV === "production") {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: user,
  });
};

module.exports = sendTokenResponse;
