const AppError = require('../utils/AppError');
function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong. Please try again.';
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const fields = Object.keys(err.errors || {}).map((k) => err.errors[k].message);
    message = fields.length ? fields[0] : 'Invalid input provided.';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier provided.';
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE';
    message = 'A record with this value already exists.';
  } else if (!err.isOperational) {
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError' || err.message.includes('buffering timed out')) {
      statusCode = 503;
      code = 'DB_UNAVAILABLE';
      message = 'The database is temporarily unavailable. Please try again shortly.';
    } else {
      console.error('Unexpected error:', err);
    }
  }
  if (res.headersSent) return next(err);
  return res.status(statusCode).json({ success: false, code, message });
}
module.exports = { notFoundHandler, errorHandler };
