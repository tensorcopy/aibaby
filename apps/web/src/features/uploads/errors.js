const { RouteDependencyError } = require('../baby-profile/errors');

class ConflictRouteError extends RouteDependencyError {
  constructor(message = 'Request conflicts with current resource state') {
    super(message, 409);
  }
}

module.exports = {
  ConflictRouteError,
};
