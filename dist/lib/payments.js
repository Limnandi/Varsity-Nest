"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProviderSubscriptionPrice = calculateProviderSubscriptionPrice;
function calculateProviderSubscriptionPrice(input) {
    var _a, _b, _c;
    var base = (_a = input.basePrice) !== null && _a !== void 0 ? _a : 450;
    var extra = (_b = input.extraSitePrice) !== null && _b !== void 0 ? _b : 50;
    var featured = (_c = input.featuredPrice) !== null && _c !== void 0 ? _c : 50;
    var additionalSites = Math.max(0, (input.accommodationsCount || 0) - 1);
    var total = base + (additionalSites * extra) + (input.wantsFeatured ? featured : 0);
    return Number(total.toFixed(2));
}
