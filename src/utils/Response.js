class Response {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.statusCode = null;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(payload) {
    return this.res.status(this.statusCode).json(payload);
  }

  encryptAndSend(payload) {
    const encrypted = this.req.clientCypher.encrypt(JSON.stringify(payload));
    return this.res.status(this.statusCode).send(encrypted);
  }

  static handleError(methodName, error, req, res, next) {
    try {
      const { status, error: err, ...rest } = JSON.parse(error.message);
      return res.status(status).json({ errors: err, ...rest });
    } catch (e) {
      return next(
        `${methodName}: ${
          error.message ||
          'Uncaught Exception. Please contact the technical support team'
        }`
      );
    }
  }
}
module.exports = Response;
