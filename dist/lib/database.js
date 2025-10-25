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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSQL = getSQL;
exports.getDB = getDB;
exports.query = query;
exports.testConnection = testConnection;
exports.tableExists = tableExists;
exports.getTableRowCount = getTableRowCount;
exports.authenticateUser = authenticateUser;
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
var schema = __importStar(require("./schema"));
var env_1 = require("@/lib/env");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
// For some reason at this time on this date, I could not commit changes, hence I'm writing them here - Added deprecation warnings and basic injection protection to existing query function.
var _sql;
var _db;
function getDatabaseUrl() {
    return env_1.env.DATABASE_URL;
}
//Design pattern: Singleton
function getSQL() {
    if (!_sql) {
        _sql = (0, serverless_1.neon)(getDatabaseUrl());
    }
    return _sql;
}
//Design pattern: Singleton
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
        var result, error_1, failedQuery;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Log only in development
                    if (env_1.env.NODE_ENV === 'development') {
                        console.log("Executing query:", strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '').substring(0, 100) + "...");
                        console.log("Query params:", values);
                    }
                    return [4 /*yield*/, getSQL().apply(void 0, __spreadArray([strings], values, false))];
                case 1:
                    result = _a.sent();
                    if (env_1.env.NODE_ENV === 'development') {
                        console.log("Query executed successfully");
                        console.log("Rows affected:", Array.isArray(result) ? result.length : "N/A");
                    }
                    return [2 /*return*/, {
                            rows: Array.isArray(result) ? result : [result],
                            rowCount: Array.isArray(result) ? result.length : 1,
                        }];
                case 2:
                    error_1 = _a.sent();
                    console.error("Database query error:", error_1);
                    failedQuery = strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '');
                    console.error("Failed query:", failedQuery);
                    console.error("Failed params:", values);
                    throw error_1;
                case 3: return [2 /*return*/];
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
                    _a.trys.push([0, 2, , 3]);
                    console.log("Testing database connection...");
                    return [4 /*yield*/, query(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT NOW() as current_time"], ["SELECT NOW() as current_time"])))];
                case 1:
                    result = _a.sent();
                    console.log("Database connection successful:", result.rows[0]);
                    return [2 /*return*/, true];
                case 2:
                    error_2 = _a.sent();
                    console.error("Database connection failed:", error_2);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Helper function to check if a table exists
function tableExists(tableName) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, query(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  SELECT EXISTS (\n    SELECT FROM information_schema.tables \n    WHERE table_schema = 'public' \n    AND table_name = ", "\n  )\n"], ["\n  SELECT EXISTS (\n    SELECT FROM information_schema.tables \n    WHERE table_schema = 'public' \n    AND table_name = ", "\n  )\n"])), tableName)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows[0].exists];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error checking if table ".concat(tableName, " exists:"), error_3);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Helper function to get table row count
function getTableRowCount(tableName) {
    return __awaiter(this, void 0, void 0, function () {
        var secureDb, result, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, import('./database-secure')];
                case 1:
                    secureDb = (_b.sent()).secureDb;
                    return [4 /*yield*/, secureDb.executeRawQuery("SELECT COUNT(*) as count FROM ".concat(tableName))];
                case 2:
                    result = _b.sent();
                    return [2 /*return*/, Number.parseInt(((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || '0')];
                case 3:
                    error_4 = _b.sent();
                    console.error("Error getting row count for table ".concat(tableName, ":"), error_4);
                    return [2 /*return*/, 0];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Authentication function for database fallback
function authenticateUser(email, password) {
    return __awaiter(this, void 0, void 0, function () {
        var secureDb, eq, schema_1, user, isPasswordValid, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, import('./database-secure')];
                case 1:
                    secureDb = (_a.sent()).secureDb;
                    return [4 /*yield*/, import('drizzle-orm')];
                case 2:
                    eq = (_a.sent()).eq;
                    return [4 /*yield*/, import('./schema')];
                case 3:
                    schema_1 = _a.sent();
                    return [4 /*yield*/, secureDb.db
                            .select({
                            id: schema_1.users.id,
                            email: schema_1.users.email,
                            password: schema_1.users.password,
                            firstName: schema_1.users.firstName,
                            lastName: schema_1.users.lastName,
                            role: schema_1.users.role,
                            isActive: schema_1.users.isActive,
                            emailVerified: schema_1.users.emailVerified,
                            createdAt: schema_1.users.createdAt,
                            updatedAt: schema_1.users.updatedAt
                        })
                            .from(schema_1.users)
                            .where(eq(schema_1.users.email, email.toLowerCase()))
                            .limit(1)];
                case 4:
                    user = (_a.sent())[0];
                    if (!user) {
                        // Log security event for monitoring
                        console.warn("Authentication attempt failed: User not found for email: ".concat(email));
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
                case 5:
                    isPasswordValid = _a.sent();
                    if (!isPasswordValid) {
                        // Log security event for monitoring
                        console.warn("Authentication attempt failed: Invalid password for email: ".concat(email));
                        return [2 /*return*/, null];
                    }
                    if (!user.isActive) {
                        // Log security event for monitoring
                        console.warn("Authentication attempt failed: Inactive account for email: ".concat(email));
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            name: "".concat(user.firstName, " ").concat(user.lastName).trim(),
                            role: user.role,
                            isActive: user.isActive,
                            emailVerified: user.emailVerified || false,
                            createdAt: user.createdAt,
                            updatedAt: user.updatedAt
                        }];
                case 6:
                    error_5 = _a.sent();
                    console.error("Authentication error:", error_5);
                    return [2 /*return*/, null];
                case 7: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2;
