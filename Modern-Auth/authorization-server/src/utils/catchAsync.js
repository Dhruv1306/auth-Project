
/**
 * Wraps async functions to catch errors and pass them to the Express next() handler.
 * This is necessary for Express 4 to handle async/await errors properly.
 */
module.exports = (fn) => {
  return (req, res, next) => {
    const result = fn(req, res, next);
    if (result && result.catch) {
      result.catch(next);
    }
  };
};
