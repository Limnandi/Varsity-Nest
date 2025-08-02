"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidStudentEmail = isValidStudentEmail;
function isValidStudentEmail(email) {
    var studentEmailPatterns = [
        /@ufs\.ac\.za$/,
        /@student\.ufs\.ac\.za$/,
        /@kovsies\.ac\.za$/,
        /@student\.kovsies\.ac\.za$/,
    ];
    return studentEmailPatterns.some(function (pattern) { return pattern.test(email.toLowerCase()); });
}
