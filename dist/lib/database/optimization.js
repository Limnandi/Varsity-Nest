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
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeDatabaseSchedule = exports.createIndexIfNotExists = exports.optimizeTable = exports.getDatabaseStats = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var connection_1 = require("./connection");
var logger_1 = require("@/lib/logging/logger");
var performance_1 = require("@/lib/monitoring/performance");
var getDatabaseStats = function () { return __awaiter(void 0, void 0, void 0, function () {
    var endMetric, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                endMetric = performance_1.performanceMonitor.startMetric('get_database_stats');
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                return [4 /*yield*/, connection_1.db.execute((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT\n        schemaname || '.' || relname as table_name,\n        n_live_tup as total_rows,\n        pg_size_pretty(pg_total_relation_size(relid)) as table_size,\n        pg_size_pretty(pg_indexes_size(relid)) as index_size,\n        n_dead_tup as dead_tuples\n      FROM pg_stat_user_tables\n      ORDER BY pg_total_relation_size(relid) DESC;\n    "], ["\n      SELECT\n        schemaname || '.' || relname as table_name,\n        n_live_tup as total_rows,\n        pg_size_pretty(pg_total_relation_size(relid)) as table_size,\n        pg_size_pretty(pg_indexes_size(relid)) as index_size,\n        n_dead_tup as dead_tuples\n      FROM pg_stat_user_tables\n      ORDER BY pg_total_relation_size(relid) DESC;\n    "]))))];
            case 2:
                result = _a.sent();
                return [2 /*return*/, result.rows];
            case 3:
                endMetric();
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getDatabaseStats = getDatabaseStats;
var optimizeTable = function (tableName) { return __awaiter(void 0, void 0, void 0, function () {
    var endMetric, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                endMetric = performance_1.performanceMonitor.startMetric('optimize_table');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, 5, 6]);
                // First, analyze the table
                return [4 /*yield*/, connection_1.db.execute((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["ANALYZE VERBOSE ", ""], ["ANALYZE VERBOSE ", ""])), drizzle_orm_1.sql.raw(tableName)))];
            case 2:
                // First, analyze the table
                _a.sent();
                // Then vacuum it
                return [4 /*yield*/, connection_1.db.execute((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["VACUUM ANALYZE ", ""], ["VACUUM ANALYZE ", ""])), drizzle_orm_1.sql.raw(tableName)))];
            case 3:
                // Then vacuum it
                _a.sent();
                logger_1.log.info("Table ".concat(tableName, " has been optimized"));
                return [3 /*break*/, 6];
            case 4:
                error_1 = _a.sent();
                logger_1.log.error("Failed to optimize table ".concat(tableName), error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                throw error_1;
            case 5:
                endMetric();
                return [7 /*endfinally*/];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.optimizeTable = optimizeTable;
var createIndexIfNotExists = function (tableName, columnName, indexName) { return __awaiter(void 0, void 0, void 0, function () {
    var endMetric, indexExists, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                endMetric = performance_1.performanceMonitor.startMetric('create_index');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, 6, 7]);
                return [4 /*yield*/, connection_1.db.execute((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      SELECT 1\n      FROM pg_indexes\n      WHERE tablename = ", "\n      AND indexname = ", "\n    "], ["\n      SELECT 1\n      FROM pg_indexes\n      WHERE tablename = ", "\n      AND indexname = ", "\n    "])), tableName, indexName))];
            case 2:
                indexExists = _a.sent();
                if (!(!indexExists || !indexExists.rows || indexExists.rows.length === 0)) return [3 /*break*/, 4];
                return [4 /*yield*/, connection_1.db.execute((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n        CREATE INDEX IF NOT EXISTS ", "\n        ON ", " (", ")\n      "], ["\n        CREATE INDEX IF NOT EXISTS ", "\n        ON ", " (", ")\n      "])), drizzle_orm_1.sql.raw(indexName), drizzle_orm_1.sql.raw(tableName), drizzle_orm_1.sql.raw(columnName)))];
            case 3:
                _a.sent();
                logger_1.log.info("Created index ".concat(indexName, " on ").concat(tableName, "(").concat(columnName, ")"));
                _a.label = 4;
            case 4: return [3 /*break*/, 7];
            case 5:
                error_2 = _a.sent();
                logger_1.log.error("Failed to create index ".concat(indexName), error_2 instanceof Error ? error_2 : new Error('Unknown error'));
                throw error_2;
            case 6:
                endMetric();
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createIndexIfNotExists = createIndexIfNotExists;
var optimizeDatabaseSchedule = function () { return __awaiter(void 0, void 0, void 0, function () {
    var stats, _i, stats_1, table, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                return [4 /*yield*/, (0, exports.getDatabaseStats)()];
            case 1:
                stats = _a.sent();
                _i = 0, stats_1 = stats;
                _a.label = 2;
            case 2:
                if (!(_i < stats_1.length)) return [3 /*break*/, 5];
                table = stats_1[_i];
                if (!(table.deadTuples > table.totalRows * 0.1)) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, exports.optimizeTable)(table.tableName)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                logger_1.log.info('Database optimization schedule completed');
                return [3 /*break*/, 7];
            case 6:
                error_3 = _a.sent();
                logger_1.log.error('Failed to run database optimization schedule', error_3 instanceof Error ? error_3 : new Error('Unknown error'));
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.optimizeDatabaseSchedule = optimizeDatabaseSchedule;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
