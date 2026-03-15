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

class BadRequestRouteError extends RouteDependencyError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

module.exports = {
  BadRequestRouteError,
  NotFoundRouteError,
  RouteDependencyError,
  UnauthorizedRouteError,
};
