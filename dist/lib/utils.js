"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.slugify = slugify;
exports.truncateText = truncateText;
exports.generateId = generateId;
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.formatPhone = formatPhone;
exports.calculateDaysBetween = calculateDaysBetween;
exports.isDateInRange = isDateInRange;
exports.getInitials = getInitials;
exports.capitalizeFirst = capitalizeFirst;
exports.removeHtmlTags = removeHtmlTags;
exports.debounce = debounce;
exports.throttle = throttle;
exports.getRandomColor = getRandomColor;
exports.getStatusColor = getStatusColor;
exports.parseSearchParams = parseSearchParams;
exports.buildSearchParams = buildSearchParams;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
    }).format(amount);
}
function formatDate(date) {
    var dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(dateObj);
}
function formatDateTime(date) {
    var dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(dateObj);
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength).trim() + "...";
}
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPhone(phone) {
    var phoneRegex = /^(\+27|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
}
function formatPhone(phone) {
    var cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("27")) {
        return "+".concat(cleaned);
    }
    if (cleaned.startsWith("0")) {
        return "+27".concat(cleaned.substring(1));
    }
    return phone;
}
function calculateDaysBetween(startDate, endDate) {
    var timeDifference = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
}
function isDateInRange(date, startDate, endDate) {
    return date >= startDate && date <= endDate;
}
function getInitials(name) {
    return name
        .split(" ")
        .map(function (word) { return word.charAt(0).toUpperCase(); })
        .join("")
        .substring(0, 2);
}
function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
function removeHtmlTags(html) {
    return html.replace(/<[^>]*>/g, "");
}
function debounce(func, wait) {
    var timeout;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        clearTimeout(timeout);
        timeout = setTimeout(function () { return func.apply(void 0, args); }, wait);
    };
}
function throttle(func, limit) {
    var inThrottle;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(void 0, args);
            inThrottle = true;
            setTimeout(function () { return (inThrottle = false); }, limit);
        }
    };
}
function getRandomColor() {
    var colors = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-teal-500",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case "active":
        case "confirmed":
        case "paid":
        case "completed":
            return "text-green-600 bg-green-100";
        case "pending":
        case "processing":
            return "text-yellow-600 bg-yellow-100";
        case "inactive":
        case "cancelled":
        case "failed":
            return "text-red-600 bg-red-100";
        case "draft":
        case "unpaid":
            return "text-gray-600 bg-gray-100";
        default:
            return "text-gray-600 bg-gray-100";
    }
}
function parseSearchParams(searchParams) {
    var params = {};
    for (var _i = 0, _a = Array.from(searchParams.entries()); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (params[key]) {
            if (Array.isArray(params[key])) {
                ;
                params[key].push(value);
            }
            else {
                params[key] = [params[key], value];
            }
        }
        else {
            params[key] = value;
        }
    }
    return params;
}
function buildSearchParams(params) {
    var searchParams = new URLSearchParams();
    Object.entries(params).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach(function (v) { return searchParams.append(key, v); });
            }
            else {
                searchParams.set(key, value);
            }
        }
    });
    return searchParams.toString();
}
