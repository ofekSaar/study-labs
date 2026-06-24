/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
  // Always log full error server-side; never expose stack traces to clients
  console.error('❌ Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response = { status: 'error', message };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
