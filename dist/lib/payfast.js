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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePayFastSignature = generatePayFastSignature;
exports.createPayFastPayment = createPayFastPayment;
exports.verifyPayFastSignature = verifyPayFastSignature;
var crypto_1 = __importDefault(require("crypto"));
function generatePayFastSignature(data, passphrase) {
    // Create parameter string
    var paramString = "";
    var sortedKeys = Object.keys(data).sort();
    for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
        var key = sortedKeys_1[_i];
        var value = data[key];
        if (value !== undefined && value !== "") {
            paramString += "".concat(key, "=").concat(encodeURIComponent(value), "&");
        }
    }
    // Remove trailing &
    paramString = paramString.slice(0, -1);
    // Add passphrase if provided
    if (passphrase) {
        paramString += "&passphrase=".concat(encodeURIComponent(passphrase));
    }
    // Generate MD5 hash
    return crypto_1.default.createHash("md5").update(paramString).digest("hex");
}
function createPayFastPayment(amount, userEmail, userName, itemName, customData) {
    var data = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: "".concat(process.env.NEXT_PUBLIC_APP_URL, "/provider/billing/success"),
        cancel_url: "".concat(process.env.NEXT_PUBLIC_APP_URL, "/provider/billing/cancel"),
        notify_url: "".concat(process.env.NEXT_PUBLIC_APP_URL, "/api/payfast/notify"),
        name_first: userName.split(" ")[0] || userName,
        name_last: userName.split(" ").slice(1).join(" ") || "",
        email_address: userEmail,
        amount: amount.toFixed(2),
        item_name: itemName,
        item_description: "Varsity Nest - ".concat(itemName),
        custom_str1: customData === null || customData === void 0 ? void 0 : customData.providerId,
        custom_str2: customData === null || customData === void 0 ? void 0 : customData.subscriptionType,
    };
    var signature = generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE);
    return __assign(__assign({}, data), { signature: signature });
}
function verifyPayFastSignature(data, signature) {
    var generatedSignature = generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE);
    return generatedSignature === signature;
}
