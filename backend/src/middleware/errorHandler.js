/**
 * Global Express error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with that value already exists.',
    });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
    });
  }

  // Postgres check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Value violates a check constraint.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export default errorHandler;
