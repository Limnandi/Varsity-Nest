"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHealth = exports.BatchOperations = exports.OptimizedAccommodationRepository = exports.QueryMonitor = void 0;
exports.getPool = getPool;
exports.getSQL = getSQL;
exports.getDB = getDB;
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
var pg_1 = require("pg");
var schema = __importStar(require("./schema"));
var env_1 = require("@/lib/env");
var drizzle_orm_1 = require("drizzle-orm");
var redis_1 = require("./redis");
// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
    throw new Error('This module can only be used on the server side');
}
// Connection pool configuration
var poolConfig = {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
var _pool = null;
var _sql = null;
var _db = null;
function getDatabaseUrl() {
    return env_1.env.DATABASE_URL;
}
// Optimized connection pool
function getPool() {
    if (!_pool) {
        _pool = new pg_1.Pool(__assign({ connectionString: getDatabaseUrl() }, poolConfig));
    }
    return _pool;
}
// Optimized SQL connection
function getSQL() {
    if (!_sql) {
        _sql = (0, serverless_1.neon)(getDatabaseUrl(), {
            arrayMode: false,
            fullResults: false,
        });
    }
    return _sql;
}
// Optimized Drizzle instance
function getDB() {
    if (!_db) {
        _db = (0, neon_http_1.drizzle)(getSQL(), { schema: schema });
    }
    return _db;
}
// Query performance monitoring
var QueryMonitor = /** @class */ (function () {
    function QueryMonitor() {
    }
    QueryMonitor.executeWithMonitoring = function (queryName, queryFn) {
        return __awaiter(this, void 0, void 0, function () {
            var start, result, duration, error_1, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        start = performance.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, queryFn()];
                    case 2:
                        result = _a.sent();
                        duration = performance.now() - start;
                        this.recordQueryTime(queryName, duration);
                        if (duration > 1000) {
                            console.warn("Slow query detected: ".concat(queryName, " took ").concat(duration.toFixed(2), "ms"));
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        duration = performance.now() - start;
                        console.error("Query failed: ".concat(queryName, " after ").concat(duration.toFixed(2), "ms"), error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    QueryMonitor.recordQueryTime = function (queryName, duration) {
        if (!this.queryTimes.has(queryName)) {
            this.queryTimes.set(queryName, []);
        }
        var times = this.queryTimes.get(queryName);
        times.push(duration);
        // Keep only last 100 measurements
        if (times.length > 100) {
            times.shift();
        }
    };
    QueryMonitor.getQueryStats = function (queryName) {
        var times = this.queryTimes.get(queryName) || [];
        if (times.length === 0)
            return null;
        var avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
        var max = Math.max.apply(Math, times);
        var min = Math.min.apply(Math, times);
        return { avg: avg, max: max, min: min, count: times.length };
    };
    QueryMonitor.queryTimes = new Map();
    return QueryMonitor;
}());
exports.QueryMonitor = QueryMonitor;
// Optimized accommodation repository with caching
var OptimizedAccommodationRepository = /** @class */ (function () {
    function OptimizedAccommodationRepository() {
    }
    OptimizedAccommodationRepository.getFeaturedAccommodations = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var cacheKey, cached, error_2, delError_1, result, serializedResult, error_3;
            var _this = this;
            if (limit === void 0) { limit = 9; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "".concat(this.FEATURED_CACHE_KEY, ":").concat(limit);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 11]);
                        return [4 /*yield*/, redis_1.redis.get(cacheKey)];
                    case 2:
                        cached = _a.sent();
                        if (!cached) return [3 /*break*/, 5];
                        if (!(typeof cached === 'string')) return [3 /*break*/, 3];
                        return [2 /*return*/, JSON.parse(cached)];
                    case 3:
                        // Corrupted cache entry, delete it
                        console.warn("[CACHE] Corrupted cache entry for ".concat(cacheKey, ", deleting..."));
                        return [4 /*yield*/, redis_1.redis.del(cacheKey)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 11];
                    case 6:
                        error_2 = _a.sent();
                        console.warn("[CACHE] Cache get error for ".concat(cacheKey, ":"), error_2);
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, redis_1.redis.del(cacheKey)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        delError_1 = _a.sent();
                        console.warn("[CACHE] Failed to delete corrupted cache key ".concat(cacheKey));
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 11];
                    case 11: return [4 /*yield*/, QueryMonitor.executeWithMonitoring("getFeaturedAccommodations", function () { return __awaiter(_this, void 0, void 0, function () {
                            var accommodations;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getDB()
                                            .select({
                                            id: schema.accommodations.id,
                                            name: schema.accommodations.name,
                                            description: schema.accommodations.description,
                                            address: schema.accommodations.address,
                                            price: schema.accommodations.price,
                                            images: schema.accommodations.images,
                                            amenities: schema.accommodations.amenities,
                                            area: schema.accommodations.area,
                                            distance: schema.accommodations.distance,
                                            rating: schema.accommodations.rating,
                                            reviewCount: schema.accommodations.reviewCount,
                                            isOpen: schema.accommodations.isOpen,
                                            featured: schema.accommodations.featured,
                                            availableRooms: schema.accommodations.availableRooms,
                                            totalRooms: schema.accommodations.totalRooms,
                                            isVerified: schema.accommodations.isVerified,
                                            accreditationStatus: schema.accommodations.accreditationStatus,
                                        })
                                            .from(schema.accommodations)
                                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.accommodations.isActive, true), (0, drizzle_orm_1.eq)(schema.accommodations.featured, true)))
                                            .orderBy((0, drizzle_orm_1.desc)(schema.accommodations.createdAt))
                                            .limit(limit)];
                                    case 1:
                                        accommodations = _a.sent();
                                        return [2 /*return*/, accommodations.map(function (acc) { return ({
                                                id: acc.id,
                                                name: acc.name,
                                                description: acc.description,
                                                address: acc.address,
                                                price: acc.price,
                                                images: acc.images || [],
                                                amenities: acc.amenities || [],
                                                accreditation_status: 'accredited',
                                                provider_id: null,
                                                area: acc.area,
                                                distance: acc.distance,
                                                rating: acc.rating,
                                                review_count: acc.reviewCount,
                                                is_open: acc.isOpen,
                                                featured: acc.featured,
                                                available_rooms: acc.availableRooms,
                                                total_rooms: acc.totalRooms,
                                                is_verified: acc.isVerified
                                            }); })];
                                }
                            });
                        }); })
                        // Cache result
                    ];
                    case 12:
                        result = _a.sent();
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        serializedResult = JSON.stringify(result, function (_, value) {
                            // Handle special cases for JSON serialization
                            if (value instanceof Date) {
                                return value.toISOString();
                            }
                            if (typeof value === 'bigint') {
                                return value.toString();
                            }
                            return value;
                        });
                        return [4 /*yield*/, redis_1.redis.set(cacheKey, serializedResult, { ex: this.CACHE_TTL })];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_3 = _a.sent();
                        console.warn("Cache set error for ".concat(cacheKey, ":"), error_3);
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/, result];
                }
            });
        });
    };
    OptimizedAccommodationRepository.getAccommodationsByStatus = function (status_1) {
        return __awaiter(this, arguments, void 0, function (status, limit, offset) {
            var cacheKey, cached, error_4, delError_2, result, serializedResult, error_5;
            var _this = this;
            if (limit === void 0) { limit = 200; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "".concat(this.STATUS_CACHE_KEY, ":").concat(status, ":").concat(limit, ":").concat(offset);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 11]);
                        return [4 /*yield*/, redis_1.redis.get(cacheKey)];
                    case 2:
                        cached = _a.sent();
                        if (!cached) return [3 /*break*/, 5];
                        if (!(typeof cached === 'string')) return [3 /*break*/, 3];
                        return [2 /*return*/, JSON.parse(cached)];
                    case 3:
                        // Corrupted cache entry, delete it
                        console.warn("[CACHE] Corrupted cache entry for ".concat(cacheKey, ", deleting..."));
                        return [4 /*yield*/, redis_1.redis.del(cacheKey)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 11];
                    case 6:
                        error_4 = _a.sent();
                        console.warn("[CACHE] Cache get error for ".concat(cacheKey, ":"), error_4);
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, redis_1.redis.del(cacheKey)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        delError_2 = _a.sent();
                        console.warn("[CACHE] Failed to delete corrupted cache key ".concat(cacheKey));
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 11];
                    case 11: return [4 /*yield*/, QueryMonitor.executeWithMonitoring("getAccommodationsByStatus", function () { return __awaiter(_this, void 0, void 0, function () {
                            var accommodations;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getDB()
                                            .select({
                                            id: schema.accommodations.id,
                                            name: schema.accommodations.name,
                                            description: schema.accommodations.description,
                                            address: schema.accommodations.address,
                                            price: schema.accommodations.price,
                                            images: schema.accommodations.images,
                                            amenities: schema.accommodations.amenities,
                                            area: schema.accommodations.area,
                                            distance: schema.accommodations.distance,
                                            rating: schema.accommodations.rating,
                                            reviewCount: schema.accommodations.reviewCount,
                                            isOpen: schema.accommodations.isOpen,
                                            featured: schema.accommodations.featured,
                                            availableRooms: schema.accommodations.availableRooms,
                                            totalRooms: schema.accommodations.totalRooms,
                                            isVerified: schema.accommodations.isVerified,
                                            accreditationStatus: schema.accommodations.accreditationStatus,
                                        })
                                            .from(schema.accommodations)
                                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.accommodations.isActive, true), (0, drizzle_orm_1.eq)(schema.accommodations.accreditationStatus, status)))
                                            .orderBy((0, drizzle_orm_1.desc)(schema.accommodations.createdAt))
                                            .limit(limit)
                                            .offset(offset)];
                                    case 1:
                                        accommodations = _a.sent();
                                        return [2 /*return*/, accommodations.map(function (acc) { return ({
                                                id: acc.id,
                                                name: acc.name,
                                                description: acc.description,
                                                address: acc.address,
                                                price: acc.price,
                                                images: acc.images || [],
                                                amenities: acc.amenities || [],
                                                accreditation_status: acc.accreditationStatus,
                                                provider_id: null,
                                                area: acc.area,
                                                distance: acc.distance,
                                                rating: acc.rating,
                                                review_count: acc.reviewCount,
                                                is_open: acc.isOpen,
                                                featured: acc.featured,
                                                available_rooms: acc.availableRooms,
                                                total_rooms: acc.totalRooms,
                                                is_verified: acc.isVerified
                                            }); })];
                                }
                            });
                        }); })
                        // Cache result
                    ];
                    case 12:
                        result = _a.sent();
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        serializedResult = JSON.stringify(result, function (_, value) {
                            // Handle special cases for JSON serialization
                            if (value instanceof Date) {
                                return value.toISOString();
                            }
                            if (typeof value === 'bigint') {
                                return value.toString();
                            }
                            return value;
                        });
                        return [4 /*yield*/, redis_1.redis.set(cacheKey, serializedResult, { ex: this.CACHE_TTL })];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_5 = _a.sent();
                        console.warn("Cache set error for ".concat(cacheKey, ":"), error_5);
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/, result];
                }
            });
        });
    };
    OptimizedAccommodationRepository.getAccommodationsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, error_6, delError_3, result, serializedResult, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (ids.length === 0)
                            return [2 /*return*/, []];
                        cacheKey = "accommodations:ids:".concat(ids.sort().join(','));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 11]);
                        return [4 /*yield*/, redis_1.redis.get(cacheKey)];
                    case 2:
                        cached = _a.sent();
                        if (!cached) return [3 /*break*/, 5];
                        if (!(typeof cached === 'string')) return [3 /*break*/, 3];
                        return [2 /*return*/, JSON.parse(cached)];
                    case 3:
                        // Corrupted cache entry, delete it
                        console.warn("[CACHE] Corrupted cache entry for ".concat(cacheKey, ", deleting..."));
                        return [4 /*yield*/, redis_1.redis.del(cacheKey)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 11];
                    case 6:
                        error_6 = _a.sent();
                        console.warn("[CACHE] Cache get error for ".concat(cacheKey, ":"), error_6);
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, redis_1.redis.del(cacheKey)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        delError_3 = _a.sent();
                        console.warn("[CACHE] Failed to delete corrupted cache key ".concat(cacheKey));
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 11];
                    case 11: return [4 /*yield*/, QueryMonitor.executeWithMonitoring("getAccommodationsByIds", function () { return __awaiter(_this, void 0, void 0, function () {
                            var accommodations;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getDB()
                                            .select()
                                            .from(schema.accommodations)
                                            .where((0, drizzle_orm_1.inArray)(schema.accommodations.id, ids))];
                                    case 1:
                                        accommodations = _a.sent();
                                        return [2 /*return*/, accommodations];
                                }
                            });
                        }); })
                        // Cache result
                    ];
                    case 12:
                        result = _a.sent();
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        serializedResult = JSON.stringify(result, function (_, value) {
                            // Handle special cases for JSON serialization
                            if (value instanceof Date) {
                                return value.toISOString();
                            }
                            if (typeof value === 'bigint') {
                                return value.toString();
                            }
                            return value;
                        });
                        return [4 /*yield*/, redis_1.redis.set(cacheKey, serializedResult, { ex: this.CACHE_TTL })];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_7 = _a.sent();
                        console.warn("Cache set error for ".concat(cacheKey, ":"), error_7);
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/, result];
                }
            });
        });
    };
    OptimizedAccommodationRepository.invalidateCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // Upstash Redis doesn't support keys() method
                    // We'll need to track keys manually or use a different approach
                    console.warn("Cache invalidation not fully supported in Upstash Redis");
                }
                catch (error) {
                    console.error("Cache invalidation error:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    OptimizedAccommodationRepository.CACHE_TTL = 300; // 5 minutes
    OptimizedAccommodationRepository.FEATURED_CACHE_KEY = "accommodations:featured";
    OptimizedAccommodationRepository.STATUS_CACHE_KEY = "accommodations:status";
    return OptimizedAccommodationRepository;
}());
exports.OptimizedAccommodationRepository = OptimizedAccommodationRepository;
// Batch operations for N+1 query prevention
var BatchOperations = /** @class */ (function () {
    function BatchOperations() {
    }
    BatchOperations.getAccommodationsWithProviders = function (accommodationIds) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (accommodationIds.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, QueryMonitor.executeWithMonitoring("getAccommodationsWithProviders", function () { return __awaiter(_this, void 0, void 0, function () {
                                var result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, getDB()
                                                .select({
                                                id: schema.accommodations.id,
                                                name: schema.accommodations.name,
                                                description: schema.accommodations.description,
                                                address: schema.accommodations.address,
                                                price: schema.accommodations.price,
                                                images: schema.accommodations.images,
                                                amenities: schema.accommodations.amenities,
                                                providerId: schema.accommodations.providerId,
                                                providerName: schema.providers.businessName,
                                                providerEmail: schema.providers.contactEmail,
                                                providerPhone: schema.providers.contactPhone,
                                            })
                                                .from(schema.accommodations)
                                                .leftJoin(schema.providers, (0, drizzle_orm_1.eq)(schema.accommodations.providerId, schema.providers.id))
                                                .where((0, drizzle_orm_1.inArray)(schema.accommodations.id, accommodationIds))];
                                        case 1:
                                            result = _a.sent();
                                            return [2 /*return*/, result];
                                    }
                                });
                            }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BatchOperations.getAccommodationStats = function (accommodationIds) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (accommodationIds.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, QueryMonitor.executeWithMonitoring("getAccommodationStats", function () { return __awaiter(_this, void 0, void 0, function () {
                                var result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, getDB()
                                                .select({
                                                accommodationId: schema.reviews.accommodationId,
                                                avgRating: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["AVG(", ")"], ["AVG(", ")"])), schema.reviews.rating),
                                                reviewCount: (0, drizzle_orm_1.count)(schema.reviews.id),
                                            })
                                                .from(schema.reviews)
                                                .where((0, drizzle_orm_1.inArray)(schema.reviews.accommodationId, accommodationIds))
                                                .groupBy(schema.reviews.accommodationId)];
                                        case 1:
                                            result = _a.sent();
                                            return [2 /*return*/, result];
                                    }
                                });
                            }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return BatchOperations;
}());
exports.BatchOperations = BatchOperations;
// Database health monitoring
var DatabaseHealth = /** @class */ (function () {
    function DatabaseHealth() {
    }
    DatabaseHealth.checkConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var start, duration, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        start = performance.now();
                        return [4 /*yield*/, getSQL()(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                    case 1:
                        _a.sent();
                        duration = performance.now() - start;
                        return [2 /*return*/, {
                                status: 'healthy',
                                responseTime: duration,
                                timestamp: new Date().toISOString()
                            }];
                    case 2:
                        error_8 = _a.sent();
                        return [2 /*return*/, {
                                status: 'unhealthy',
                                error: error_8 instanceof Error ? error_8.message : 'Unknown error',
                                timestamp: new Date().toISOString()
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseHealth.getPerformanceMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, _i, _a, queryName, stats;
            return __generator(this, function (_b) {
                metrics = new Map();
                for (_i = 0, _a = QueryMonitor.queryTimes; _i < _a.length; _i++) {
                    queryName = _a[_i][0];
                    stats = QueryMonitor.getQueryStats(queryName);
                    if (stats) {
                        metrics.set(queryName, stats);
                    }
                }
                return [2 /*return*/, Object.fromEntries(metrics)];
            });
        });
    };
    return DatabaseHealth;
}());
exports.DatabaseHealth = DatabaseHealth;
var templateObject_1, templateObject_2;
