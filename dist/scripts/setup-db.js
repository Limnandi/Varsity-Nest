"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var database_1 = require("../lib/database");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var fs_1 = __importDefault(require("fs"));
function mapAccreditationStatus(status) {
    // Map CSV values to valid database values
    var statusMap = {
        "ACCREDITED": "accredited",
        "PROVISIONALLY ACCREDITED": "provisionally_accredited",
        "NON-ACCREDITED": "non_accredited",
        "non-accredited": "non_accredited"
    };
    return statusMap[status.toUpperCase()] || "non_accredited";
}
var path_1 = __importDefault(require("path"));
var csv_parser_1 = __importDefault(require("csv-parser"));
var dotenv_1 = __importDefault(require("dotenv"));
// --- Configuration ---
var __dirname = path_1.default.resolve();
// Force load .env.local first to ensure variables are available
var envPath = path_1.default.join(process.cwd(), ".env.local");
var result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.error("❌ Failed to load .env.local:", result.error);
    process.exit(1);
}
console.log("✅ Loaded environment variables from:", envPath);
var ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
var UFS_ACCREDITED_PROVIDERS_CSV = path_1.default.join(process.cwd(), "data", "ufs-accredited-providers.csv");
if (!ADMIN_INITIAL_PASSWORD) {
    console.error("❌ FATAL: ADMIN_INITIAL_PASSWORD environment variable is not set.");
    process.exit(1);
}
function seedAdmin() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, sql;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("   - Seeding admin user...");
                    return [4 /*yield*/, bcryptjs_1.default.hash(ADMIN_INITIAL_PASSWORD, 10)];
                case 1:
                    hashedPassword = _a.sent();
                    sql = (0, database_1.getSQL)();
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    INSERT INTO users (first_name, last_name, email, password, role, created_at)\n    VALUES (", ", ", ", ", ", ", ", ", ", ", ")\n    ON CONFLICT (email) DO UPDATE\n    SET password = ", "\n  "], ["\n    INSERT INTO users (first_name, last_name, email, password, role, created_at)\n    VALUES (", ", ", ", ", ", ", ", ", ", ", ")\n    ON CONFLICT (email) DO UPDATE\n    SET password = ", "\n  "])), "Admin", "User", "admin@varsitynest.space", hashedPassword, "admin", new Date(), hashedPassword)];
                case 2:
                    _a.sent();
                    console.log("   ✅ Admin user seeded.");
                    return [2 /*return*/];
            }
        });
    });
}
function seedProvidersFromCSV() {
    return __awaiter(this, void 0, void 0, function () {
        var results, seededCount, _i, results_1, provider, providerName, contactPerson, email, hashedPassword, sql, newUser, newProvider;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("   - Seeding providers from CSV...");
                    if (!fs_1.default.existsSync(UFS_ACCREDITED_PROVIDERS_CSV)) {
                        throw new Error("CSV file not found at ".concat(UFS_ACCREDITED_PROVIDERS_CSV));
                    }
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var data = [];
                            fs_1.default.createReadStream(UFS_ACCREDITED_PROVIDERS_CSV)
                                .pipe((0, csv_parser_1.default)())
                                .on("data", function (row) { return data.push(row); })
                                .on("end", function () { return resolve(data); })
                                .on("error", function (error) { return reject(error); });
                        })];
                case 1:
                    results = _a.sent();
                    seededCount = 0;
                    _i = 0, results_1 = results;
                    _a.label = 2;
                case 2:
                    if (!(_i < results_1.length)) return [3 /*break*/, 8];
                    provider = results_1[_i];
                    providerName = provider["PROPERTY NAME / EIENDOM NAAM"] || "Unknown Provider";
                    contactPerson = provider["CONTACT PERSON"] || "N/A";
                    email = provider["E-MAIL"] || "provider-".concat(Date.now(), "@example.com");
                    return [4 /*yield*/, bcryptjs_1.default.hash("provider123", 10)];
                case 3:
                    hashedPassword = _a.sent();
                    sql = (0, database_1.getSQL)();
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      INSERT INTO users\n        (first_name, last_name, email, password, role)\n      VALUES\n        (", ",\n         ", ",\n         ", ",\n         ", ",\n         ", ")\n      ON CONFLICT (email) DO NOTHING\n      RETURNING id\n    "], ["\n      INSERT INTO users\n        (first_name, last_name, email, password, role)\n      VALUES\n        (", ",\n         ", ",\n         ", ",\n         ", ",\n         ", ")\n      ON CONFLICT (email) DO NOTHING\n      RETURNING id\n    "])), contactPerson.split(' ')[0] || 'Provider', contactPerson.split(' ')[1] || 'User', email, hashedPassword, "provider")];
                case 4:
                    newUser = (_a.sent())[0];
                    if (!newUser) return [3 /*break*/, 7];
                    return [4 /*yield*/, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n        INSERT INTO providers\n          (user_id, business_name, contact_person, contact_email, contact_phone, address)\n        VALUES\n          (", ",\n           ", ",\n           ", ",\n           ", ",\n           ", ",\n           ", ")\n        RETURNING id\n      "], ["\n        INSERT INTO providers\n          (user_id, business_name, contact_person, contact_email, contact_phone, address)\n        VALUES\n          (", ",\n           ", ",\n           ", ",\n           ", ",\n           ", ",\n           ", ")\n        RETURNING id\n      "])), newUser.id, providerName, contactPerson, email, provider["CONTACT NUMBER"] || "0000000000", provider["PHYSICAL ADDRESS"] || "No address provided")];
                case 5:
                    newProvider = (_a.sent())[0];
                    return [4 /*yield*/, sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n        INSERT INTO accommodations\n          (provider_id, name, address, accreditation_status, price, description, images, amenities, room_types)\n        VALUES\n          (", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            '[\"/placeholder.svg?height=400&width=600\"]',\n            '[\"wifi\", \"laundry\", \"parking\"]',\n            '[\"shared-room\"]')\n      "], ["\n        INSERT INTO accommodations\n          (provider_id, name, address, accreditation_status, price, description, images, amenities, room_types)\n        VALUES\n          (", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            '[\\\"/placeholder.svg?height=400&width=600\\\"]',\n            '[\\\"wifi\\\", \\\"laundry\\\", \\\"parking\\\"]',\n            '[\\\"shared-room\\\"]')\n      "])), newProvider.id, providerName, provider["PHYSICAL ADDRESS"] || "N/A", mapAccreditationStatus(provider["ACCREDITATION STATUS"] || "non_accredited"), String(Math.floor(Math.random() * (5000 - 2500 + 1)) + 2500), "Accredited accommodation provided by ".concat(providerName, "."))];
                case 6:
                    _a.sent();
                    seededCount++;
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("   \u2705 Seeded ".concat(seededCount, " new providers and accommodations."));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("\n🌱 Starting database setup...");
                    // Note: This script assumes tables are created by a separate migration step.
                    // For simplicity in this context, we'll focus on seeding.
                    return [4 /*yield*/, seedAdmin()];
                case 1:
                    // Note: This script assumes tables are created by a separate migration step.
                    // For simplicity in this context, we'll focus on seeding.
                    _a.sent();
                    return [4 /*yield*/, seedProvidersFromCSV()];
                case 2:
                    _a.sent();
                    console.log("\n🎉 Database seeding completed successfully!");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("\n❌ An error occurred during database setup:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
main();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
