function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: {
      message: err.message || "Error interno del servidor.",
      ...(err.details ? { details: err.details } : {})
    }
  });
}

module.exports = errorHandler;
