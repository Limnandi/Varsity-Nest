"use strict";
/**
 * Password strength checker utility
 * Returns strength level and detailed feedback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPasswordStrength = checkPasswordStrength;
function checkPasswordStrength(password) {
    if (!password) {
        return {
            score: 0,
            level: 'very-weak',
            feedback: ['Enter a password'],
            color: 'red',
            percentage: 0
        };
    }
    var score = 0;
    var feedback = [];
    // Length check
    if (password.length >= 8) {
        score++;
    }
    else {
        feedback.push('At least 8 characters');
    }
    if (password.length >= 12) {
        score++;
    }
    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score++;
    }
    else {
        feedback.push('Add uppercase letters');
    }
    // Lowercase check
    if (/[a-z]/.test(password)) {
        score++;
    }
    else {
        feedback.push('Add lowercase letters');
    }
    // Number check
    if (/\d/.test(password)) {
        score++;
    }
    else {
        feedback.push('Add numbers');
    }
    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score++;
    }
    else {
        feedback.push('Add special characters');
    }
    // Calculate final score (max 4)
    var finalScore = Math.min(Math.floor(score / 1.5), 4);
    // Determine level, color, and percentage
    var level;
    var color;
    var percentage;
    if (finalScore === 0) {
        level = 'very-weak';
        color = 'red';
        percentage = 20;
    }
    else if (finalScore === 1) {
        level = 'weak';
        color = 'orange';
        percentage = 40;
    }
    else if (finalScore === 2) {
        level = 'fair';
        color = 'yellow';
        percentage = 60;
    }
    else if (finalScore === 3) {
        level = 'good';
        color = 'blue';
        percentage = 80;
    }
    else {
        level = 'strong';
        color = 'green';
        percentage = 100;
        feedback.push('Excellent password!');
    }
    return {
        score: finalScore,
        level: level,
        feedback: feedback.length > 0 ? feedback : ['Great password!'],
        color: color,
        percentage: percentage
    };
}
