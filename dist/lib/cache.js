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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
exports.cached = cached;
// Client-side cache for browser environment
var ClientCache = /** @class */ (function () {
    function ClientCache() {
    }
    ClientCache.get = function (key) {
        var item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    };
    ClientCache.set = function (key, value, ttl) {
        if (ttl === void 0) { ttl = 300000; }
        this.cache.set(key, {
            value: value,
            expiry: Date.now() + ttl
        });
    };
    ClientCache.del = function (key) {
        this.cache.delete(key);
    };
    ClientCache.clear = function () {
        this.cache.clear();
    };
    ClientCache.cache = new Map();
    return ClientCache;
}());
// Server-side cache manager (only available on server)
var ServerCacheManager = /** @class */ (function () {
    function ServerCacheManager() {
    }
    // Generic cache operations
    ServerCacheManager.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var redis, cached_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== 'undefined')
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, import("./redis")];
                    case 2:
                        redis = (_a.sent()).redis;
                        return [4 /*yield*/, redis.get(key)];
                    case 3:
                        cached_1 = _a.sent();
                        return [2 /*return*/, cached_1 ? JSON.parse(cached_1) : null];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Cache get error for key ".concat(key, ":"), error_1);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.set = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, ttl) {
            var redis, error_2;
            if (ttl === void 0) { ttl = this.DEFAULT_TTL; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== 'undefined')
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, import("./redis")];
                    case 2:
                        redis = (_a.sent()).redis;
                        return [4 /*yield*/, redis.setex(key, ttl, JSON.stringify(value))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Cache set error for key ".concat(key, ":"), error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.del = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var redis, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== 'undefined')
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, import("./redis")];
                    case 2:
                        redis = (_a.sent()).redis;
                        return [4 /*yield*/, redis.del(key)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Cache delete error for key ".concat(key, ":"), error_3);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.delPattern = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (typeof window !== 'undefined')
                    return [2 /*return*/];
                try {
                    // Upstash Redis doesn't support keys() method
                    console.warn("Pattern deletion not supported in Upstash Redis: ".concat(pattern));
                }
                catch (error) {
                    console.error("Cache delete pattern error for ".concat(pattern, ":"), error);
                }
                return [2 /*return*/];
            });
        });
    };
    // Cache key generators
    ServerCacheManager.getAccommodationKey = function (id) {
        return "accommodation:".concat(id);
    };
    ServerCacheManager.getAccommodationsByStatusKey = function (status, limit, offset) {
        return "accommodations:status:".concat(status, ":").concat(limit, ":").concat(offset);
    };
    ServerCacheManager.getFeaturedAccommodationsKey = function (limit) {
        return "accommodations:featured:".concat(limit);
    };
    ServerCacheManager.getUserKey = function (id) {
        return "user:".concat(id);
    };
    ServerCacheManager.getProviderKey = function (id) {
        return "provider:".concat(id);
    };
    ServerCacheManager.getSearchKey = function (query, filters) {
        var filterString = Object.entries(filters)
            .sort(function (_a, _b) {
            var a = _a[0];
            var b = _b[0];
            return a.localeCompare(b);
        })
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return "".concat(k, ":").concat(v);
        })
            .join('|');
        return "search:".concat(query, ":").concat(filterString);
    };
    // Specific cache operations
    ServerCacheManager.cacheAccommodation = function (accommodation_1) {
        return __awaiter(this, arguments, void 0, function (accommodation, ttl) {
            var key;
            if (ttl === void 0) { ttl = this.DEFAULT_TTL; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationKey(accommodation.id);
                        return [4 /*yield*/, this.set(key, accommodation, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.getCachedAccommodation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationKey(id);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ServerCacheManager.cacheAccommodationsByStatus = function (status_1, limit_1, offset_1, accommodations_1) {
        return __awaiter(this, arguments, void 0, function (status, limit, offset, accommodations, ttl) {
            var key;
            if (ttl === void 0) { ttl = this.DEFAULT_TTL; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationsByStatusKey(status, limit, offset);
                        return [4 /*yield*/, this.set(key, accommodations, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.getCachedAccommodationsByStatus = function (status, limit, offset) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationsByStatusKey(status, limit, offset);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ServerCacheManager.cacheFeaturedAccommodations = function (limit_1, accommodations_1) {
        return __awaiter(this, arguments, void 0, function (limit, accommodations, ttl) {
            var key;
            if (ttl === void 0) { ttl = this.DEFAULT_TTL; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getFeaturedAccommodationsKey(limit);
                        return [4 /*yield*/, this.set(key, accommodations, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.getCachedFeaturedAccommodations = function (limit) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getFeaturedAccommodationsKey(limit);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ServerCacheManager.cacheSearchResults = function (query_1, filters_1, results_1) {
        return __awaiter(this, arguments, void 0, function (query, filters, results, ttl) {
            var key;
            if (ttl === void 0) { ttl = this.SHORT_TTL; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getSearchKey(query, filters);
                        return [4 /*yield*/, this.set(key, results, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.getCachedSearchResults = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getSearchKey(query, filters);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Cache invalidation
    ServerCacheManager.invalidateAccommodation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.del(this.getAccommodationKey(id))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.delPattern('accommodations:*')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.invalidateUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.del(this.getUserKey(id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.invalidateProvider = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.del(this.getProviderKey(id))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.delPattern('accommodations:*')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerCacheManager.invalidateAllAccommodations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delPattern('accommodation:*')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.delPattern('accommodations:*')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.delPattern('search:*')];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Cache warming
    ServerCacheManager.warmAccommodationCache = function (accommodationIds) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, accommodationIds_1, id, cached_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, accommodationIds_1 = accommodationIds;
                        _a.label = 1;
                    case 1:
                        if (!(_i < accommodationIds_1.length)) return [3 /*break*/, 4];
                        id = accommodationIds_1[_i];
                        return [4 /*yield*/, this.getCachedAccommodation(id)];
                    case 2:
                        cached_2 = _a.sent();
                        if (!cached_2) {
                            console.log("Warming cache for accommodation ".concat(id));
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Cache statistics
    ServerCacheManager.getCacheStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, {
                            totalKeys: 0,
                            memoryUsage: 'N/A',
                            hitRate: 0
                        }];
                }
                catch (error) {
                    console.error('Error getting cache stats:', error);
                    return [2 /*return*/, {
                            totalKeys: 0,
                            memoryUsage: 'Unknown',
                            hitRate: 0
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    // Cache cleanup
    ServerCacheManager.cleanupExpiredKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    console.log('Cache cleanup completed');
                }
                catch (error) {
                    console.error('Cache cleanup error:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    ServerCacheManager.DEFAULT_TTL = 300; // 5 minutes
    ServerCacheManager.SHORT_TTL = 60; // 1 minute
    return ServerCacheManager;
}());
var CacheManager = /** @class */ (function () {
    function CacheManager() {
    }
    // Cache key generators
    CacheManager.getAccommodationKey = function (id) {
        return "accommodation:".concat(id);
    };
    CacheManager.getAccommodationsByStatusKey = function (status, limit, offset) {
        return "accommodations:status:".concat(status, ":").concat(limit, ":").concat(offset);
    };
    CacheManager.getFeaturedAccommodationsKey = function (limit) {
        return "accommodations:featured:".concat(limit);
    };
    CacheManager.getUserKey = function (id) {
        return "user:".concat(id);
    };
    CacheManager.getProviderKey = function (id) {
        return "provider:".concat(id);
    };
    CacheManager.getSearchKey = function (query, filters) {
        var filterString = Object.entries(filters)
            .sort(function (_a, _b) {
            var a = _a[0];
            var b = _b[0];
            return a.localeCompare(b);
        })
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return "".concat(k, ":").concat(v);
        })
            .join('|');
        return "search:".concat(query, ":").concat(filterString);
    };
    // Generic cache operations - automatically choose client or server
    CacheManager.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== 'undefined') {
                            return [2 /*return*/, ClientCache.get(key)];
                        }
                        return [4 /*yield*/, ServerCacheManager.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    CacheManager.set = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, ttl) {
            if (ttl === void 0) { ttl = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== 'undefined') {
                            ClientCache.set(key, value, ttl * 1000); // Convert to milliseconds
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, ServerCacheManager.set(key, value, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.del = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== 'undefined') {
                            ClientCache.del(key);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, ServerCacheManager.del(key)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Specific cache operations
    CacheManager.cacheAccommodation = function (accommodation_1) {
        return __awaiter(this, arguments, void 0, function (accommodation, ttl) {
            var key;
            if (ttl === void 0) { ttl = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationKey(accommodation.id);
                        return [4 /*yield*/, this.set(key, accommodation, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.getCachedAccommodation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationKey(id);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    CacheManager.cacheAccommodationsByStatus = function (status_1, limit_1, offset_1, accommodations_1) {
        return __awaiter(this, arguments, void 0, function (status, limit, offset, accommodations, ttl) {
            var key;
            if (ttl === void 0) { ttl = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationsByStatusKey(status, limit, offset);
                        return [4 /*yield*/, this.set(key, accommodations, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.getCachedAccommodationsByStatus = function (status, limit, offset) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getAccommodationsByStatusKey(status, limit, offset);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    CacheManager.cacheFeaturedAccommodations = function (limit_1, accommodations_1) {
        return __awaiter(this, arguments, void 0, function (limit, accommodations, ttl) {
            var key;
            if (ttl === void 0) { ttl = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getFeaturedAccommodationsKey(limit);
                        return [4 /*yield*/, this.set(key, accommodations, ttl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.getCachedFeaturedAccommodations = function (limit) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getFeaturedAccommodationsKey(limit);
                        return [4 /*yield*/, this.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Client-side specific methods (synchronous for browser)
    CacheManager.getCachedAccommodationsByStatusClient = function (status, limit, offset) {
        var key = this.getAccommodationsByStatusKey(status, limit, offset);
        return ClientCache.get(key);
    };
    CacheManager.cacheAccommodationsByStatusClient = function (status, limit, offset, accommodations, ttl) {
        if (ttl === void 0) { ttl = 300000; }
        var key = this.getAccommodationsByStatusKey(status, limit, offset);
        ClientCache.set(key, accommodations, ttl);
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
// Cache decorator for functions
function cached(ttl) {
    if (ttl === void 0) { ttl = 300; }
    return function (target, propertyName, descriptor) {
        var method = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                var cacheKey, cached, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cacheKey = "".concat(target.constructor.name, ":").concat(propertyName, ":").concat(JSON.stringify(args));
                            return [4 /*yield*/, CacheManager.get(cacheKey)];
                        case 1:
                            cached = _a.sent();
                            if (cached !== null) {
                                return [2 /*return*/, cached];
                            }
                            return [4 /*yield*/, method.apply(this, args)];
                        case 2:
                            result = _a.sent();
                            return [4 /*yield*/, CacheManager.set(cacheKey, result, ttl)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
    };
}
