class RouteDependencyError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class UnauthorizedRouteError extends RouteDependencyError {
  constructor(message = 'Authentication is required') {
    super(message, 401);
  }
}

class NotFoundRouteError extends RouteDependencyError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

module.exports = {
  NotFoundRouteError,
  RouteDependencyError,
  UnauthorizedRouteError,
};
