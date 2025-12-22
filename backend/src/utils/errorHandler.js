function errorHandler(err, req, res, next){
  // Se a resposta já foi enviada, passar para o próximo handler
  if (res.headersSent) {
    return next(err);
  }

  console.error('Error Handler:', err);
  console.error('Stack:', err.stack);
  
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? (err.status === 500 ? 'Internal Server Error' : err.message)
    : err.message;

  res.status(status).json({ 
    error: 'Error',
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
module.exports = { errorHandler };
