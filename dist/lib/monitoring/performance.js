"use strict";
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
exports.performanceMonitor = void 0;
var config_1 = require("@/lib/logging/config");
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = new Map();
    }
    PerformanceMonitor.getInstance = function () {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    };
    PerformanceMonitor.prototype.startMetric = function (name) {
        var _this = this;
        var start = globalThis.performance.now();
        return function () {
            var _a;
            var end = globalThis.performance.now();
            var duration = end - start;
            if (!_this.metrics.has(name)) {
                _this.metrics.set(name, []);
            }
            (_a = _this.metrics.get(name)) === null || _a === void 0 ? void 0 : _a.push(duration);
            // Report to Sentry if in production
            if (process.env.NODE_ENV === 'production') {
                try {
                    // Add a lightweight message for traceability
                    (0, config_1.captureMessage)("".concat(name, " took ").concat(duration, "ms"), { level: 'info', component: 'performance_monitor', metric: name, duration: duration });
                }
                catch (e) {
                    // ignore
                }
            }
        };
    };
    PerformanceMonitor.prototype.getMetricStats = function (name) {
        var measurements = this.metrics.get(name);
        if (!measurements || measurements.length === 0) {
            return null;
        }
        var sorted = __spreadArray([], measurements, true).sort(function (a, b) { return a - b; });
        var p95Index = Math.floor(sorted.length * 0.95);
        return {
            avg: measurements.reduce(function (a, b) { return a + b; }, 0) / measurements.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            count: measurements.length,
            p95: sorted[p95Index],
        };
    };
    PerformanceMonitor.prototype.clearMetrics = function () {
        this.metrics.clear();
    };
    PerformanceMonitor.prototype.reportMetrics = function () {
        if (process.env.NODE_ENV !== 'production') {
            return;
        }
        // Iterate over metric names to avoid unused parameter lint warnings
        for (var _i = 0, _a = Array.from(this.metrics.keys()); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var stats = this.getMetricStats(name_1);
            if (stats) {
                try {
                    // Use setExtra to attach metric stats
                    (0, config_1.setExtra)("performance_".concat(name_1), stats);
                }
                catch (e) {
                    // ignore
                }
            }
        }
    };
    return PerformanceMonitor;
}());
exports.performanceMonitor = PerformanceMonitor.getInstance();
// Usage example:
// const endMetric = performanceMonitor.startMetric('database_query');
// ... do something ...
// endMetric();
// const stats = performanceMonitor.getMetricStats('database_query');
