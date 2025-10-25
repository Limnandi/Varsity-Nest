"use strict";
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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueryBuilder = exports.db = void 0;
exports.withCache = withCache;
var node_postgres_1 = require("drizzle-orm/node-postgres");
var pg_1 = require("pg");
var redis_1 = require("@/lib/redis");
var database_1 = require("@/lib/monitoring/database");
var logger_1 = require("@/lib/logging/logger");
// Initialize connection pool with optimal settings
var pool = new pg_1.Pool({
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close connections after 7500 queries (prevent memory leaks)
});
// Initialize drizzle with the connection pool
exports.db = (0, node_postgres_1.drizzle)(pool, {
    logger: true
});
// Cache configuration
var DEFAULT_CACHE_TTL = 300; // 5 minutes
var CACHE_ENABLED = process.env.NODE_ENV === 'production';
// Generic cache wrapper for database queries
function withCache(key_1, queryFn_1) {
    return __awaiter(this, arguments, void 0, function (key, queryFn, ttl) {
        var cached, result, e_1;
        if (ttl === void 0) { ttl = DEFAULT_CACHE_TTL; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!CACHE_ENABLED) {
                        return [2 /*return*/, queryFn()];
                    }
                    return [4 /*yield*/, redis_1.redis.get(key)];
                case 1:
                    cached = _a.sent();
                    if (cached) {
                        try {
                            return [2 /*return*/, JSON.parse(cached)];
                        }
                        catch (e) {
                            // If parsing fails, ignore and continue to fetch fresh data
                        }
                    }
                    return [4 /*yield*/, queryFn()];
                case 2:
                    result = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, redis_1.redis.set(key, JSON.stringify(result), { ex: ttl })];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    // If Redis set fails, log and continue
                    // eslint-disable-next-line no-console
                    console.warn('Redis set failed', e_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, result];
            }
        });
    });
}
// Query builder with performance monitoring
var createQueryBuilder = function (queryName, baseQuery) {
    var monitoredQuery = (0, database_1.monitorDatabaseQuery)(queryName, baseQuery);
    return {
        // Execute with cache
        withCache: function (cacheKey, ttl) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, withCache(cacheKey, monitoredQuery, ttl)];
            });
        }); },
        // Execute without cache
        execute: monitoredQuery,
        // Stream results for large datasets
        stream: function () {
            return __asyncGenerator(this, arguments, function stream_1(batchSize) {
                var offset, batch;
                if (batchSize === void 0) { batchSize = 1000; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            offset = 0;
                            _a.label = 1;
                        case 1:
                            if (!true) return [3 /*break*/, 5];
                            return [4 /*yield*/, __await(monitoredQuery({ limit: batchSize, offset: offset }))];
                        case 2:
                            batch = _a.sent();
                            if (Array.isArray(batch) && batch.length === 0)
                                return [3 /*break*/, 5];
                            return [4 /*yield*/, __await(batch)];
                        case 3: return [4 /*yield*/, _a.sent()];
                        case 4:
                            _a.sent();
                            offset += batchSize;
                            return [3 /*break*/, 1];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
    };
};
exports.createQueryBuilder = createQueryBuilder;
// Connection management
pool.on('connect', function () {
    logger_1.log.info('New database connection established');
});
pool.on('error', function (err) {
    logger_1.log.error('Database pool error', err);
});
// Cleanup on application shutdown
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.end()];
            case 1:
                _a.sent();
                logger_1.log.info('Database pool has been closed');
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error('Error closing database pool', error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                return [3 /*break*/, 3];
            case 3:
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
