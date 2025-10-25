"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceError = exports.DatabaseError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.BaseError = void 0;
var BaseError = /** @class */ (function (_super) {
    __extends(BaseError, _super);
    function BaseError(message, code, statusCode, details) {
        if (statusCode === void 0) { statusCode = 500; }
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.code = code;
        _this.statusCode = statusCode;
        _this.details = details;
        _this.name = _this.constructor.name;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return BaseError;
}(Error));
exports.BaseError = BaseError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, details) {
        return _super.call(this, message, 'VALIDATION_ERROR', 400, details) || this;
    }
    return ValidationError;
}(BaseError));
exports.ValidationError = ValidationError;
var AuthenticationError = /** @class */ (function (_super) {
    __extends(AuthenticationError, _super);
    function AuthenticationError(message) {
        if (message === void 0) { message = 'Authentication failed'; }
        return _super.call(this, message, 'AUTH_ERROR', 401) || this;
    }
    return AuthenticationError;
}(BaseError));
exports.AuthenticationError = AuthenticationError;
var AuthorizationError = /** @class */ (function (_super) {
    __extends(AuthorizationError, _super);
    function AuthorizationError(message) {
        if (message === void 0) { message = 'Not authorized'; }
        return _super.call(this, message, 'FORBIDDEN', 403) || this;
    }
    return AuthorizationError;
}(BaseError));
exports.AuthorizationError = AuthorizationError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(resource) {
        return _super.call(this, "".concat(resource, " not found"), 'NOT_FOUND', 404) || this;
    }
    return NotFoundError;
}(BaseError));
exports.NotFoundError = NotFoundError;
var DatabaseError = /** @class */ (function (_super) {
    __extends(DatabaseError, _super);
    function DatabaseError(message, details) {
        return _super.call(this, message, 'DATABASE_ERROR', 500, details) || this;
    }
    return DatabaseError;
}(BaseError));
exports.DatabaseError = DatabaseError;
var ExternalServiceError = /** @class */ (function (_super) {
    __extends(ExternalServiceError, _super);
    function ExternalServiceError(service, details) {
        return _super.call(this, "".concat(service, " service error"), 'EXTERNAL_SERVICE_ERROR', 503, details) || this;
    }
    return ExternalServiceError;
}(BaseError));
exports.ExternalServiceError = ExternalServiceError;
