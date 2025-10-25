"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSQL = getSQL;
exports.getDB = getDB;
exports.query = query;
exports.testConnection = testConnection;
exports.queryWithRetry = queryWithRetry;
exports.safeQuery = safeQuery;
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
var schema = __importStar(require("./schema"));
var env_1 = require("@/lib/env");
var error_logging_1 = require("./services/error-logging");
var _sql;
var _db;
function getDatabaseUrl() {
    return env_1.env.DATABASE_URL;
}
// Design pattern: Singleton
function getSQL() {
    if (!_sql) {
        _sql = (0, serverless_1.neon)(getDatabaseUrl());
    }
    return _sql;
}
// Design pattern: Singleton
function getDB() {
    if (!_db) {
        _db = (0, neon_http_1.drizzle)(getSQL(), { schema: schema });
    }
    return _db;
}
function query(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var queryString, result, error_1, enhancedError;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    queryString = strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '');
                    // Log query in development only
                    if (env_1.env.NODE_ENV === 'development') {
                        console.log("🔒 Executing query:", queryString.substring(0, 100) + "...");
                        console.log("📊 Query params:", values);
                    }
                    return [4 /*yield*/, getSQL().apply(void 0, __spreadArray([strings], values, false))];
                case 1:
                    result = _a.sent();
                    // Log success in development only
                    if (env_1.env.NODE_ENV === 'development') {
                        console.log("✅ Query executed successfully");
                        console.log("📈 Rows affected:", Array.isArray(result) ? result.length : "N/A");
                    }
                    return [2 /*return*/, {
                            rows: Array.isArray(result) ? result : [result],
                            rowCount: Array.isArray(result) ? result.length : 1,
                        }];
                case 2:
                    error_1 = _a.sent();
                    // Log database error with proper context
                    return [4 /*yield*/, error_logging_1.ErrorLoggingService.logDatabaseError(error_1 instanceof Error ? error_1 : new Error(String(error_1)), strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, ''), values, {
                            component: 'database_query'
                        })
                        // Re-throw with enhanced error message
                    ];
                case 3:
                    // Log database error with proper context
                    _a.sent();
                    enhancedError = new Error("Database query failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    enhancedError.stack = error_1 instanceof Error ? error_1.stack : undefined;
                    throw enhancedError;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    if (env_1.env.NODE_ENV === 'development') {
                        console.log("🔌 Testing database connection...");
                    }
                    return [4 /*yield*/, query(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 as test"], ["SELECT 1 as test"])))];
                case 1:
                    result = _a.sent();
                    if (env_1.env.NODE_ENV === 'development') {
                        console.log("✅ Database connection successful:", result.rows[0]);
                    }
                    return [2 /*return*/, { success: true, result: result.rows[0] }];
                case 2:
                    error_2 = _a.sent();
                    return [4 /*yield*/, error_logging_1.ErrorLoggingService.logDatabaseError(error_2 instanceof Error ? error_2 : new Error(String(error_2)), "SELECT 1 as test", [], {
                            component: 'database_connection_test'
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { success: false, error: error_2 instanceof Error ? error_2.message : String(error_2) }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Enhanced query function with retry logic
function queryWithRetry(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var GlobalErrorHandler;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import('./error-handler')];
                case 1:
                    GlobalErrorHandler = (_a.sent()).GlobalErrorHandler;
                    return [2 /*return*/, GlobalErrorHandler.withRetry(function () { return query.apply(void 0, __spreadArray([strings], values, false)); }, 3, // max retries
                        1000, // base delay
                        {
                            component: 'database_query_retry',
                            query: strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '').substring(0, 100)
                        })];
            }
        });
    });
}
// Safe query function that returns undefined on error
function safeQuery(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var GlobalErrorHandler;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import('./error-handler')];
                case 1:
                    GlobalErrorHandler = (_a.sent()).GlobalErrorHandler;
                    return [2 /*return*/, GlobalErrorHandler.safeAsync(function () { return query.apply(void 0, __spreadArray([strings], values, false)); }, {
                            component: 'database_safe_query',
                            query: strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '').substring(0, 100)
                        })];
            }
        });
    });
}
var templateObject_1;
