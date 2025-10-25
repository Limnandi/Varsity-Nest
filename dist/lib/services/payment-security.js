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
exports.PaymentSecurityService = void 0;
var crypto_1 = __importDefault(require("crypto"));
var config_1 = require("@/lib/logging/config");
var env_1 = require("@/lib/env");
var PaymentSecurityService = /** @class */ (function () {
    function PaymentSecurityService() {
    }
    /**
     * Validate PayFast webhook signature with enhanced security
     */
    PaymentSecurityService.verifyPayFastSignature = function (data, signature) {
        try {
            // Create parameter string with sorted keys (PayFast requirement)
            var paramString = "";
            var sortedKeys = Object.keys(data).sort();
            for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
                var key = sortedKeys_1[_i];
                var value = data[key];
                // Only include non-empty values and exclude signature field
                if (value !== undefined && value !== "" && key !== "signature") {
                    paramString += "".concat(key, "=").concat(encodeURIComponent(String(value)), "&");
                }
            }
            // Remove trailing &
            paramString = paramString.slice(0, -1);
            // Add passphrase for enhanced security
            var passphrase = env_1.env.PAYFAST_PASSPHRASE;
            if (passphrase) {
                paramString += "&passphrase=".concat(encodeURIComponent(passphrase));
            }
            // Generate MD5 hash (PayFast standard)
            var generatedSignature = crypto_1.default.createHash("md5").update(paramString).digest("hex");
            // Use timing-safe comparison to prevent timing attacks
            return crypto_1.default.timingSafeEqual(Buffer.from(generatedSignature, 'hex'), Buffer.from(signature, 'hex'));
        }
        catch (error) {
            (0, config_1.captureException)(error instanceof Error ? error : new Error(String(error)), { action: 'signature-verification', component: 'payment-security' });
            return false;
        }
    };
    /**
     * Validate PayFast webhook IP address
     */
    PaymentSecurityService.validatePayFastIP = function (ipAddress) {
        var _this = this;
        try {
            // Check if IP is in PayFast ranges
            return this.PAYFAST_IP_RANGES.some(function (range) { return _this.isIPInRange(ipAddress, range); });
        }
        catch (error) {
            (0, config_1.captureException)(error instanceof Error ? error : new Error(String(error)), { action: 'ip-validation', component: 'payment-security', ipAddress: ipAddress });
            return false;
        }
    };
    /**
     * Check if IP is in CIDR range
     */
    PaymentSecurityService.isIPInRange = function (ip, cidr) {
        var _a = cidr.split('/'), range = _a[0], bits = _a[1];
        var mask = -1 << (32 - parseInt(bits));
        var ipNum = this.ipToNumber(ip);
        var rangeNum = this.ipToNumber(range);
        return (ipNum & mask) === (rangeNum & mask);
    };
    /**
     * Convert IP address to number
     */
    PaymentSecurityService.ipToNumber = function (ip) {
        return ip.split('.').reduce(function (acc, octet) { return (acc << 8) + parseInt(octet); }, 0) >>> 0;
    };
    /**
     * Validate payment security context
     */
    PaymentSecurityService.validatePaymentSecurity = function (security) {
        try {
            // Check timestamp (prevent replay attacks)
            var now = Date.now();
            var requestTime = security.timestamp.getTime();
            var timeDiff = Math.abs(now - requestTime);
            // Allow 5 minutes tolerance
            if (timeDiff > 5 * 60 * 1000) {
                (0, config_1.captureMessage)('Payment request timestamp too old', { level: 'warning', component: 'payment-security', timeDiff: timeDiff, ipAddress: security.ipAddress });
                return false;
            }
            // Validate merchant ID
            if (security.merchantId !== env_1.env.PAYFAST_MERCHANT_ID) {
                (0, config_1.captureMessage)('Invalid merchant ID in payment request', { level: 'error', component: 'payment-security', merchantId: security.merchantId, ipAddress: security.ipAddress });
                return false;
            }
            return true;
        }
        catch (error) {
            (0, config_1.captureException)(error instanceof Error ? error : new Error(String(error)), { action: 'security-validation', component: 'payment-security' });
            return false;
        }
    };
    /**
     * Generate secure payment ID
     */
    PaymentSecurityService.generateSecurePaymentId = function () {
        var timestamp = Date.now().toString(36);
        var random = crypto_1.default.randomBytes(8).toString('hex');
        return "vn_".concat(timestamp, "_").concat(random);
    };
    /**
     * Validate payment amount (prevent manipulation)
     */
    PaymentSecurityService.validatePaymentAmount = function (amount, expectedAmount, tolerance) {
        if (tolerance === void 0) { tolerance = 0.01; }
        return Math.abs(amount - expectedAmount) <= tolerance;
    };
    /**
     * Sanitize payment data for logging (remove sensitive info)
     */
    PaymentSecurityService.sanitizePaymentData = function (data) {
        var sanitized = __assign({}, data);
        // Remove sensitive fields
        delete sanitized.signature;
        delete sanitized.token;
        delete sanitized.passphrase;
        // Mask email addresses
        if (sanitized.email_address) {
            var _a = sanitized.email_address.split('@'), local = _a[0], domain = _a[1];
            sanitized.email_address = "".concat(local.slice(0, 2), "***@").concat(domain);
        }
        return sanitized;
    };
    PaymentSecurityService.PAYFAST_IP_RANGES = [
        '41.74.179.0/24',
        '41.74.180.0/24',
        '41.74.181.0/24',
        '41.74.182.0/24',
        '41.74.183.0/24',
        '41.74.184.0/24',
        '41.74.185.0/24',
        '41.74.186.0/24',
        '41.74.187.0/24',
        '41.74.188.0/24',
        '41.74.189.0/24',
        '41.74.190.0/24',
        '41.74.191.0/24',
        '41.74.192.0/24',
        '41.74.193.0/24',
        '41.74.194.0/24',
        '41.74.195.0/24',
        '41.74.196.0/24',
        '41.74.197.0/24',
        '41.74.198.0/24',
        '41.74.199.0/24',
        '41.74.200.0/24',
        '41.74.201.0/24',
        '41.74.202.0/24',
        '41.74.203.0/24',
        '41.74.204.0/24',
        '41.74.205.0/24',
        '41.74.206.0/24',
        '41.74.207.0/24',
        '41.74.208.0/24',
        '41.74.209.0/24',
        '41.74.210.0/24',
        '41.74.211.0/24',
        '41.74.212.0/24',
        '41.74.213.0/24',
        '41.74.214.0/24',
        '41.74.215.0/24',
        '41.74.216.0/24',
        '41.74.217.0/24',
        '41.74.218.0/24',
        '41.74.219.0/24',
        '41.74.220.0/24',
        '41.74.221.0/24',
        '41.74.222.0/24',
        '41.74.223.0/24',
        '41.74.224.0/24',
        '41.74.225.0/24',
        '41.74.226.0/24',
        '41.74.227.0/24',
        '41.74.228.0/24',
        '41.74.229.0/24',
        '41.74.230.0/24',
        '41.74.231.0/24',
        '41.74.232.0/24',
        '41.74.233.0/24',
        '41.74.234.0/24',
        '41.74.235.0/24',
        '41.74.236.0/24',
        '41.74.237.0/24',
        '41.74.238.0/24',
        '41.74.239.0/24',
        '41.74.240.0/24',
        '41.74.241.0/24',
        '41.74.242.0/24',
        '41.74.243.0/24',
        '41.74.244.0/24',
        '41.74.245.0/24',
        '41.74.246.0/24',
        '41.74.247.0/24',
        '41.74.248.0/24',
        '41.74.249.0/24',
        '41.74.250.0/24',
        '41.74.251.0/24',
        '41.74.252.0/24',
        '41.74.253.0/24',
        '41.74.254.0/24',
        '41.74.255.0/24'
    ];
    return PaymentSecurityService;
}());
exports.PaymentSecurityService = PaymentSecurityService;
