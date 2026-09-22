import { HTTP_STATUS, type HttpStatusCode } from "./http-status";

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errors?: string[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: string[],
    isOperational = true
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors?: string[]) {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(message = "You must be logged in") {
    return new ApiError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message = "You don't have permission") {
    return new ApiError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(message, HTTP_STATUS.CONFLICT);
  }

  static tooManyRequests(message = "Too many requests. Please try again later.") {
    return new ApiError(message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  static validation(errors: string[], message = "Validation failed") {
    return new ApiError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  static internal(message = "Something went wrong") {
    return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, undefined, false);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function handlePrismaError(error: unknown): ApiError {
  const prismaError = error as {
    code?: string;
    meta?: Record<string, unknown>;
    message?: string;
  };

  switch (prismaError.code) {
    case "P2002": {
      const target = prismaError.meta?.target;
      let fieldName = "";
      if (Array.isArray(target)) {
        fieldName = target.join(", ");
      } else if (typeof target === "string") {
        fieldName = target;
      }
      return ApiError.conflict(
        fieldName
          ? `A record with the same ${fieldName} already exists.`
          : "A record with this value already exists."
      );
    }
    case "P2025":
      return ApiError.notFound("The requested record was not found.");
    case "P2003":
      return ApiError.badRequest("The referenced record could not be found or has dependent data.");
    case "P2014":
      return ApiError.badRequest("The requested change cannot be completed because other records depend on it.");
    case "P2011": {
      const constraint = prismaError.meta?.constraint || prismaError.meta?.target;
      const fieldStr = typeof constraint === "string" ? constraint.replace(/.*_/, "") : "";
      return ApiError.badRequest(
        fieldStr
          ? `A required value for '${fieldStr}' was not provided.`
          : "A required field is missing or cannot be empty."
      );
    }
    case "P2012": {
      const path = prismaError.meta?.path;
      return ApiError.badRequest(
        path
          ? `Missing required field: ${String(path)}.`
          : "A required field value is missing."
      );
    }
    case "P2000":
      return ApiError.badRequest("One of the provided values exceeds the maximum permitted length.");
    case "P2005":
    case "P2006":
      return ApiError.badRequest("One of the provided values has an invalid format.");
    default:
      return ApiError.internal("A database error occurred. Please try again.");
  }
}

