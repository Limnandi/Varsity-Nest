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
exports.generatePayFastSignature = generatePayFastSignature;
exports.createPayFastPayment = createPayFastPayment;
exports.verifyPayFastSignature = verifyPayFastSignature;
exports.verifyPayFastITNWithServer = verifyPayFastITNWithServer;
exports.validatePayFastResponse = validatePayFastResponse;
var crypto_1 = __importDefault(require("crypto"));
var env_1 = require("@/lib/env");
function generatePayFastSignature(data, passphrase) {
    // Create parameter string with sorted keys (PayFast requirement)
    var paramString = "";
    var sortedKeys = Object.keys(data).sort();
    for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
        var key = sortedKeys_1[_i];
        var value = data[key];
        // Only include non-empty values and exclude signature field
        if (value !== undefined && value !== "" && key !== "signature") {
            paramString += "".concat(key, "=").concat(encodeURIComponent(value), "&");
        }
    }
    // Remove trailing &
    paramString = paramString.slice(0, -1);
    // Add passphrase if provided (PayFast security requirement)
    if (passphrase) {
        paramString += "&passphrase=".concat(encodeURIComponent(passphrase));
    }
    // Generate MD5 hash (PayFast standard)
    return crypto_1.default.createHash("md5").update(paramString).digest("hex");
}
//Design pattern: Adapter
function createPayFastPayment(amount, userEmail, userName, itemName, customData) {
    var _a, _b;
    var data = {
        // Required merchant credentials
        merchant_id: env_1.env.PAYFAST_MERCHANT_ID,
        merchant_key: env_1.env.PAYFAST_MERCHANT_KEY,
        // URLs
        return_url: "".concat(env_1.env.APP_URL, "/provider/billing/success"),
        cancel_url: "".concat(env_1.env.APP_URL, "/provider/billing/cancel"),
        notify_url: "".concat(env_1.env.APP_URL, "/api/payfast/notify"),
        // Customer information
        name_first: userName.split(" ")[0] || userName,
        name_last: userName.split(" ").slice(1).join(" ") || "",
        email_address: userEmail,
        // Payment details
        amount: amount.toFixed(2),
        item_name: itemName,
        item_description: "Varsity Nest - ".concat(itemName),
        // Custom data for tracking
        custom_str1: customData === null || customData === void 0 ? void 0 : customData.providerId,
        custom_str2: customData === null || customData === void 0 ? void 0 : customData.subscriptionType,
        custom_str3: customData === null || customData === void 0 ? void 0 : customData.paymentId,
        custom_str4: (customData === null || customData === void 0 ? void 0 : customData.wantsFeatured) ? "featured_true" : undefined,
        // Currency and locale
        currency: "ZAR",
        locale: "en-za",
        // Payment method (let user choose)
        payment_method: "all",
        // Subscription details if applicable
        subscription_type: (customData === null || customData === void 0 ? void 0 : customData.subscriptionType) === "recurring" ? "subscription" : undefined,
        billing_date: customData === null || customData === void 0 ? void 0 : customData.billingDate,
        recurring_amount: (_a = customData === null || customData === void 0 ? void 0 : customData.recurringAmount) === null || _a === void 0 ? void 0 : _a.toFixed(2),
        cycles: (_b = customData === null || customData === void 0 ? void 0 : customData.cycles) === null || _b === void 0 ? void 0 : _b.toString(),
        // Unique payment ID for tracking
        m_payment_id: (customData === null || customData === void 0 ? void 0 : customData.paymentId) || "vn_".concat(Date.now()),
    };
    // Remove undefined values
    Object.keys(data).forEach(function (key) {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    var signature = generatePayFastSignature(data, env_1.env.PAYFAST_PASSPHRASE);
    return __assign(__assign({}, data), { signature: signature });
}
function verifyPayFastSignature(data, signature) {
    try {
        var generatedSignature = generatePayFastSignature(data, env_1.env.PAYFAST_PASSPHRASE);
        return generatedSignature === signature;
    }
    catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}
// Best-practice: Server-to-server ITN verification with PayFast
// Docs: https://developers.payfast.co.za/documentation/#itn-instant-transaction-notification
function verifyPayFastITNWithServer(data, originalFieldOrder) {
    return __awaiter(this, void 0, void 0, function () {
        var keys, queryString, host, resp, text, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    keys = Array.isArray(originalFieldOrder) && originalFieldOrder.length > 0
                        ? originalFieldOrder.filter(function (k) { return k !== 'signature'; })
                        : Object.keys(data).sort();
                    queryString = keys
                        .filter(function (k) { return data[k] !== undefined && data[k] !== "" && k !== "signature"; })
                        .map(function (k) { return "".concat(k, "=").concat(encodeURIComponent(data[k])); })
                        .join("&");
                    host = env_1.env.NODE_ENV === 'production' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
                    return [4 /*yield*/, fetch("https://".concat(host, "/eng/query/validate"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: queryString,
                        })];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.text()];
                case 2:
                    text = (_a.sent()).trim().toLowerCase();
                    return [2 /*return*/, text === 'valid'];
                case 3:
                    error_1 = _a.sent();
                    console.error('ITN server verification error:', error_1);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Helper function to validate PayFast response
function validatePayFastResponse(data) {
    var errors = [];
    // Check required fields
    var requiredFields = ['payment_status', 'pf_payment_id', 'amount_gross'];
    requiredFields.forEach(function (field) {
        if (!data[field]) {
            errors.push("Missing required field: ".concat(field));
        }
    });
    // Validate payment status
    var validStatuses = ['COMPLETE', 'PENDING', 'FAILED', 'CANCELLED'];
    if (data.payment_status && !validStatuses.includes(data.payment_status)) {
        errors.push("Invalid payment status: ".concat(data.payment_status));
    }
    // Validate amount format
    if (data.amount_gross && isNaN(Number(data.amount_gross))) {
        errors.push('Invalid amount format');
    }
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
