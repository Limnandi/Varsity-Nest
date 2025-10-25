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
exports.monitorDatabaseQuery = void 0;
var performance_1 = require("./performance");
var config_1 = require("@/lib/logging/config");
var monitorDatabaseQuery = function (queryName, queryFn) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(void 0, void 0, void 0, function () {
            var transaction, endMetric, result, error_1, stats;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        transaction = (0, config_1.startSentryTransaction)(queryName, 'db.query');
                        endMetric = performance_1.performanceMonitor.startMetric("db_query_".concat(queryName));
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, queryFn.apply(void 0, args)];
                    case 2:
                        result = _f.sent();
                        (_a = transaction === null || transaction === void 0 ? void 0 : transaction.setData) === null || _a === void 0 ? void 0 : _a.call(transaction, 'query_success', true);
                        (_b = transaction === null || transaction === void 0 ? void 0 : transaction.setData) === null || _b === void 0 ? void 0 : _b.call(transaction, 'args_count', args.length);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _f.sent();
                        (_c = transaction === null || transaction === void 0 ? void 0 : transaction.setData) === null || _c === void 0 ? void 0 : _c.call(transaction, 'query_success', false);
                        if (error_1 instanceof Error) {
                            (_d = transaction === null || transaction === void 0 ? void 0 : transaction.setData) === null || _d === void 0 ? void 0 : _d.call(transaction, 'error_message', error_1.message);
                        }
                        throw error_1;
                    case 4:
                        endMetric();
                        (_e = transaction === null || transaction === void 0 ? void 0 : transaction.finish) === null || _e === void 0 ? void 0 : _e.call(transaction);
                        stats = performance_1.performanceMonitor.getMetricStats("db_query_".concat(queryName));
                        if (stats && stats.avg > 1000) { // More than 1 second
                            try {
                                (0, config_1.captureMessage)('Slow database query detected', { level: 'warning', queryName: queryName, performanceStats: stats });
                            }
                            catch (e) {
                                // ignore
                            }
                        }
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
};
exports.monitorDatabaseQuery = monitorDatabaseQuery;
// Example usage:
// const monitoredQuery = monitorDatabaseQuery('getUserById', getUserById);
// const user = await monitoredQuery(userId);
