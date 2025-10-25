"use strict";
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
exports.fetchFeaturedAccommodations = fetchFeaturedAccommodations;
exports.fetchAccommodationsByStatus = fetchAccommodationsByStatus;
exports.fetchAccommodationByIdWithProvider = fetchAccommodationByIdWithProvider;
exports.fetchAccommodationsByProvider = fetchAccommodationsByProvider;
exports.countAccommodationsByProvider = countAccommodationsByProvider;
exports.insertAccommodation = insertAccommodation;
var database_secure_1 = require("@/lib/database-secure");
var drizzle_orm_1 = require("drizzle-orm");
var schema = __importStar(require("@/lib/schema"));
var crypto_1 = require("crypto");
function fetchFeaturedAccommodations() {
    return __awaiter(this, arguments, void 0, function (limit) {
        var accommodations;
        if (limit === void 0) { limit = 9; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, database_secure_1.secureDb.db
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
                        isVerified: schema.accommodations.isVerified
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
                            accreditation_status: 'accredited', // Default value
                            provider_id: null, // Will be populated if needed
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
    });
}
function fetchAccommodationsByStatus(status_1) {
    return __awaiter(this, arguments, void 0, function (status, limit, offset) {
        var accommodations;
        if (limit === void 0) { limit = 200; }
        if (offset === void 0) { offset = 0; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, database_secure_1.secureDb.db
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
                        accreditationStatus: schema.accommodations.accreditationStatus
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
                            provider_id: null, // Will be populated if needed
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
    });
}
function fetchAccommodationByIdWithProvider(id) {
    return __awaiter(this, void 0, void 0, function () {
        var accommodation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, database_secure_1.secureDb.db
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
                        providerEmail: schema.providers.contactEmail
                    })
                        .from(schema.accommodations)
                        .leftJoin(schema.providers, (0, drizzle_orm_1.eq)(schema.accommodations.providerId, schema.providers.id))
                        .where((0, drizzle_orm_1.eq)(schema.accommodations.id, id))
                        .limit(1)];
                case 1:
                    accommodation = (_a.sent())[0];
                    return [2 /*return*/, accommodation || null];
            }
        });
    });
}
function fetchAccommodationsByProvider(providerId_1) {
    return __awaiter(this, arguments, void 0, function (providerId, limit) {
        var accommodations;
        if (limit === void 0) { limit = 200; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, database_secure_1.secureDb.db
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
                        providerId: schema.accommodations.providerId
                    })
                        .from(schema.accommodations)
                        .where((0, drizzle_orm_1.eq)(schema.accommodations.providerId, providerId))
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
                            accreditation_status: acc.accreditationStatus,
                            provider_id: acc.providerId,
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
    });
}
function countAccommodationsByProvider(providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, database_secure_1.secureDb.db
                        .select({ count: (0, drizzle_orm_1.count)(schema.accommodations.id) })
                        .from(schema.accommodations)
                        .where((0, drizzle_orm_1.eq)(schema.accommodations.providerId, providerId))];
                case 1:
                    result = (_a.sent())[0];
                    return [2 /*return*/, Number((result === null || result === void 0 ? void 0 : result.count) || 0)];
            }
        });
    });
}
function insertAccommodation(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var accommodation;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0: return [4 /*yield*/, database_secure_1.secureDb.db
                        .insert(schema.accommodations)
                        .values({
                        id: (0, crypto_1.randomUUID)(),
                        name: payload.name,
                        description: payload.description || null,
                        address: payload.address,
                        price: payload.price,
                        amenities: payload.amenities || [],
                        images: payload.images || [],
                        accreditationStatus: payload.accreditation_status || 'accredited',
                        providerId: payload.provider_id || null,
                        area: payload.area || null,
                        distance: payload.distance || null,
                        featured: (_a = payload.featured) !== null && _a !== void 0 ? _a : false,
                        availableRooms: (_b = payload.available_rooms) !== null && _b !== void 0 ? _b : 0,
                        totalRooms: (_c = payload.total_rooms) !== null && _c !== void 0 ? _c : 0,
                        isVerified: (_d = payload.is_verified) !== null && _d !== void 0 ? _d : false,
                        hasSingleRooms: (_e = payload.has_single_rooms) !== null && _e !== void 0 ? _e : false,
                        hasSharingRooms: (_f = payload.has_sharing_rooms) !== null && _f !== void 0 ? _f : false,
                        singleRoomPrice: (_g = payload.single_room_price) !== null && _g !== void 0 ? _g : 0,
                        sharingRoomPrice: (_h = payload.sharing_room_price) !== null && _h !== void 0 ? _h : 0,
                        listingStatus: (_j = payload.listing_status) !== null && _j !== void 0 ? _j : 'draft',
                        isPublished: (_k = payload.is_published) !== null && _k !== void 0 ? _k : false,
                        isActive: true
                    })
                        .returning()];
                case 1:
                    accommodation = (_l.sent())[0];
                    return [2 /*return*/, accommodation];
            }
        });
    });
}
