"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
var winston_1 = __importDefault(require("winston"));
var logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: { service: 'demo-stuff' },
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
exports.log = {
    info: function (message, context) {
        logger.info(message, context);
    },
    error: function (message, error, context) {
        logger.error(message, __assign(__assign({}, context), { error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            } }));
    },
    warn: function (message, context) {
        logger.warn(message, context);
    },
    debug: function (message, context) {
        logger.debug(message, context);
    },
    http: function (req, context) {
        logger.http("".concat(req.method, " ").concat(req.url), __assign(__assign({}, context), { headers: req.headers, ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown' }));
    }
};
exports.default = exports.log;
