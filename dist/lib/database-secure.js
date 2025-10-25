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
exports.secureDb = exports.SecureDatabase = exports.BookingSchema = exports.AccommodationSchema = exports.UserSchema = void 0;
exports.getSQL = getSQL;
exports.getDB = getDB;
exports.secureQuery = secureQuery;
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
var schema = __importStar(require("./schema"));
var env_1 = require("@/lib/env");
var drizzle_orm_1 = require("drizzle-orm");
var zod_1 = require("zod");
var crypto_1 = require("crypto");
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
// Input validation schemas
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(8).max(255),
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    role: zod_1.z.enum(['admin', 'provider', 'student']),
    phone: zod_1.z.string().max(20).optional(),
    studentNumber: zod_1.z.string().max(50).optional(),
    institution: zod_1.z.string().max(100).optional(),
    isActive: zod_1.z.boolean().default(true),
    emailVerified: zod_1.z.boolean().default(false)
});
exports.AccommodationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    address: zod_1.z.string().min(1).max(500),
    price: zod_1.z.number().positive(),
    images: zod_1.z.array(zod_1.z.string().url()).default([]),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    accreditationStatus: zod_1.z.enum(['accredited', 'provisionally_accredited', 'non_accredited']),
    providerId: zod_1.z.string().uuid(),
    contactEmail: zod_1.z.string().email().optional(),
    contactPhone: zod_1.z.string().max(20).optional(),
    websiteUrl: zod_1.z.string().url().optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    roomTypes: zod_1.z.array(zod_1.z.string()).default([]),
    maxOccupancy: zod_1.z.number().positive().optional(),
    availableFrom: zod_1.z.date().optional(),
    availableUntil: zod_1.z.date().optional(),
    isActive: zod_1.z.boolean().default(true)
});
exports.BookingSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    studentId: zod_1.z.string().uuid(),
    accommodationId: zod_1.z.string().uuid(),
    checkInDate: zod_1.z.date(),
    checkOutDate: zod_1.z.date(),
    totalAmount: zod_1.z.number().positive(),
    status: zod_1.z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
    paymentStatus: zod_1.z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
    specialRequests: zod_1.z.string().max(1000).optional()
});
// Secure query wrapper with built-in validation
var SecureDatabase = /** @class */ (function () {
    function SecureDatabase() {
        this.db = getDB();
        this.sql = getSQL();
    }
    // Secure user operations
    SecureDatabase.prototype.createUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedData, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validatedData = exports.UserSchema.parse(userData);
                        return [4 /*yield*/, this.db.insert(schema.users).values({
                                id: validatedData.id || (0, crypto_1.randomUUID)(),
                                email: validatedData.email.toLowerCase(),
                                password: validatedData.password, // Should be hashed before calling this
                                firstName: validatedData.firstName,
                                lastName: validatedData.lastName,
                                role: validatedData.role,
                                phone: validatedData.phone,
                                studentNumber: validatedData.studentNumber,
                                institution: validatedData.institution,
                                isActive: validatedData.isActive,
                                emailVerified: validatedData.emailVerified
                            }).returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    SecureDatabase.prototype.getUserById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid user ID format");
                        }
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema.users)
                                .where((0, drizzle_orm_1.eq)(schema.users.id, id))
                                .limit(1)];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    SecureDatabase.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().email().safeParse(email).success) {
                            throw new Error("Invalid email format");
                        }
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema.users)
                                .where((0, drizzle_orm_1.eq)(schema.users.email, email.toLowerCase()))
                                .limit(1)];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    SecureDatabase.prototype.updateUser = function (id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedData, user;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid user ID format");
                        }
                        validatedData = exports.UserSchema.partial().parse(updateData);
                        return [4 /*yield*/, this.db
                                .update(schema.users)
                                .set(__assign(__assign({}, validatedData), { email: (_a = validatedData.email) === null || _a === void 0 ? void 0 : _a.toLowerCase(), updatedAt: new Date() }))
                                .where((0, drizzle_orm_1.eq)(schema.users.id, id))
                                .returning()];
                    case 1:
                        user = (_b.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    SecureDatabase.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid user ID format");
                        }
                        return [4 /*yield*/, this.db.delete(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    // Secure accommodation operations
    SecureDatabase.prototype.createAccommodation = function (accommodationData) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedData, accommodation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validatedData = exports.AccommodationSchema.parse(accommodationData);
                        return [4 /*yield*/, this.db.insert(schema.accommodations).values({
                                id: validatedData.id || (0, crypto_1.randomUUID)(),
                                name: validatedData.name,
                                description: validatedData.description,
                                address: validatedData.address,
                                price: validatedData.price,
                                images: validatedData.images,
                                amenities: validatedData.amenities,
                                accreditationStatus: validatedData.accreditationStatus,
                                providerId: validatedData.providerId,
                                contactEmail: validatedData.contactEmail,
                                contactPhone: validatedData.contactPhone,
                                websiteUrl: validatedData.websiteUrl,
                                latitude: validatedData.latitude,
                                longitude: validatedData.longitude,
                                roomTypes: validatedData.roomTypes,
                                maxOccupancy: validatedData.maxOccupancy,
                                availableFrom: validatedData.availableFrom,
                                availableUntil: validatedData.availableUntil,
                                isActive: validatedData.isActive
                            }).returning()];
                    case 1:
                        accommodation = (_a.sent())[0];
                        return [2 /*return*/, accommodation];
                }
            });
        });
    };
    SecureDatabase.prototype.getAccommodationById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var accommodation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid accommodation ID format");
                        }
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema.accommodations)
                                .where((0, drizzle_orm_1.eq)(schema.accommodations.id, id))
                                .limit(1)];
                    case 1:
                        accommodation = (_a.sent())[0];
                        return [2 /*return*/, accommodation];
                }
            });
        });
    };
    SecureDatabase.prototype.getAccommodationsByProvider = function (providerId_1) {
        return __awaiter(this, arguments, void 0, function (providerId, limit, offset) {
            if (limit === void 0) { limit = 50; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(providerId).success) {
                            throw new Error("Invalid provider ID format");
                        }
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema.accommodations)
                                .where((0, drizzle_orm_1.eq)(schema.accommodations.providerId, providerId))
                                .limit(limit)
                                .offset(offset)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SecureDatabase.prototype.updateAccommodation = function (id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedData, accommodation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid accommodation ID format");
                        }
                        validatedData = exports.AccommodationSchema.partial().parse(updateData);
                        return [4 /*yield*/, this.db
                                .update(schema.accommodations)
                                .set(__assign(__assign({}, validatedData), { updatedAt: new Date() }))
                                .where((0, drizzle_orm_1.eq)(schema.accommodations.id, id))
                                .returning()];
                    case 1:
                        accommodation = (_a.sent())[0];
                        return [2 /*return*/, accommodation];
                }
            });
        });
    };
    SecureDatabase.prototype.deleteAccommodation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid accommodation ID format");
                        }
                        return [4 /*yield*/, this.db.delete(schema.accommodations).where((0, drizzle_orm_1.eq)(schema.accommodations.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    // Secure booking operations
    SecureDatabase.prototype.createBooking = function (bookingData) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedData, booking;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validatedData = exports.BookingSchema.parse(bookingData);
                        return [4 /*yield*/, this.db.insert(schema.bookings).values({
                                id: validatedData.id || (0, crypto_1.randomUUID)(),
                                studentId: validatedData.studentId,
                                accommodationId: validatedData.accommodationId,
                                checkInDate: validatedData.checkInDate,
                                checkOutDate: validatedData.checkOutDate,
                                totalAmount: validatedData.totalAmount,
                                status: validatedData.status,
                                paymentStatus: validatedData.paymentStatus,
                                specialRequests: validatedData.specialRequests
                            }).returning()];
                    case 1:
                        booking = (_a.sent())[0];
                        return [2 /*return*/, booking];
                }
            });
        });
    };
    SecureDatabase.prototype.getBookingById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var booking;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(id).success) {
                            throw new Error("Invalid booking ID format");
                        }
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema.bookings)
                                .where((0, drizzle_orm_1.eq)(schema.bookings.id, id))
                                .limit(1)];
                    case 1:
                        booking = (_a.sent())[0];
                        return [2 /*return*/, booking];
                }
            });
        });
    };
    SecureDatabase.prototype.getBookingsByStudent = function (studentId_1) {
        return __awaiter(this, arguments, void 0, function (studentId, limit, offset) {
            if (limit === void 0) { limit = 50; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(studentId).success) {
                            throw new Error("Invalid student ID format");
                        }
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema.bookings)
                                .where((0, drizzle_orm_1.eq)(schema.bookings.studentId, studentId))
                                .orderBy((0, drizzle_orm_1.desc)(schema.bookings.createdAt))
                                .limit(limit)
                                .offset(offset)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Transaction support
    SecureDatabase.prototype.withTransaction = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var txDb;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        txDb = new SecureDatabase();
                                        txDb.db = tx;
                                        return [4 /*yield*/, callback(txDb)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Secure raw queries (only when absolutely necessary)
    SecureDatabase.prototype.executeRawQuery = function (query_1) {
        return __awaiter(this, arguments, void 0, function (query, params) {
            var dangerousPatterns;
            if (params === void 0) { params = []; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dangerousPatterns = [
                            /DROP\s+TABLE/i,
                            /DELETE\s+FROM/i,
                            /UPDATE\s+.*\s+SET/i,
                            /INSERT\s+INTO/i,
                            /ALTER\s+TABLE/i,
                            /CREATE\s+TABLE/i,
                            /TRUNCATE/i
                        ];
                        if (dangerousPatterns.some(function (pattern) { return pattern.test(query); })) {
                            throw new Error("Dangerous query detected. Use specific methods instead.");
                        }
                        return [4 /*yield*/, this.sql(query, params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Statistics and analytics (secure)
    SecureDatabase.prototype.getAccommodationStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .select({
                            totalAccommodations: (0, drizzle_orm_1.count)(schema.accommodations.id),
                            totalRevenue: (0, drizzle_orm_1.sum)(schema.bookings.totalAmount),
                            averageRating: (0, drizzle_orm_1.avg)(schema.reviews.rating),
                            totalBookings: (0, drizzle_orm_1.count)(schema.bookings.id)
                        })
                            .from(schema.accommodations)
                            .leftJoin(schema.bookings, (0, drizzle_orm_1.eq)(schema.accommodations.id, schema.bookings.accommodationId))
                            .leftJoin(schema.reviews, (0, drizzle_orm_1.eq)(schema.accommodations.id, schema.reviews.accommodationId))];
                    case 1:
                        stats = (_a.sent())[0];
                        return [2 /*return*/, stats];
                }
            });
        });
    };
    SecureDatabase.prototype.getProviderStats = function (providerId) {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!zod_1.z.string().uuid().safeParse(providerId).success) {
                            throw new Error("Invalid provider ID format");
                        }
                        return [4 /*yield*/, this.db
                                .select({
                                totalAccommodations: (0, drizzle_orm_1.count)(schema.accommodations.id),
                                totalRevenue: (0, drizzle_orm_1.sum)(schema.bookings.totalAmount),
                                averageRating: (0, drizzle_orm_1.avg)(schema.reviews.rating),
                                totalBookings: (0, drizzle_orm_1.count)(schema.bookings.id)
                            })
                                .from(schema.accommodations)
                                .leftJoin(schema.bookings, (0, drizzle_orm_1.eq)(schema.accommodations.id, schema.bookings.accommodationId))
                                .leftJoin(schema.reviews, (0, drizzle_orm_1.eq)(schema.accommodations.id, schema.reviews.accommodationId))
                                .where((0, drizzle_orm_1.eq)(schema.accommodations.providerId, providerId))];
                    case 1:
                        stats = (_a.sent())[0];
                        return [2 /*return*/, stats];
                }
            });
        });
    };
    return SecureDatabase;
}());
exports.SecureDatabase = SecureDatabase;
// Export singleton instance
exports.secureDb = new SecureDatabase();
// Legacy compatibility - secure wrapper for existing query function
function secureQuery(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var _loop_1, _a, values_1, value, result, error_1, failedQuery;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _loop_1 = function (value) {
                        if (typeof value === 'string') {
                            // Check for SQL injection patterns
                            var dangerousPatterns = [
                                /['";]/, // Quotes and semicolons
                                /--/, // SQL comments
                                /\/\*.*\*\//, // Block comments
                                /(union|select|insert|update|delete|drop|create|alter|truncate)/i // SQL keywords
                            ];
                            if (dangerousPatterns.some(function (pattern) { return pattern.test(value); })) {
                                throw new Error("Potentially dangerous value detected: ".concat(value));
                            }
                        }
                    };
                    // Validate all values to prevent injection
                    for (_a = 0, values_1 = values; _a < values_1.length; _a++) {
                        value = values_1[_a];
                        _loop_1(value);
                    }
                    console.log("🔒 Executing secure query:", strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '').substring(0, 100) + "...");
                    console.log("📊 Query params:", values);
                    return [4 /*yield*/, getSQL().apply(void 0, __spreadArray([strings], values, false))];
                case 1:
                    result = _b.sent();
                    console.log("✅ Secure query executed successfully");
                    console.log("📈 Rows affected:", Array.isArray(result) ? result.length : "N/A");
                    return [2 /*return*/, {
                            rows: Array.isArray(result) ? result : [result],
                            rowCount: Array.isArray(result) ? result.length : 1,
                        }];
                case 2:
                    error_1 = _b.sent();
                    console.error("❌ Secure database query error:", error_1);
                    failedQuery = strings.reduce(function (query, part, i) { var _a; return query + part + ((_a = values[i]) !== null && _a !== void 0 ? _a : ''); }, '');
                    console.error("🔍 Failed query:", failedQuery);
                    console.error("📊 Failed params:", values);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
