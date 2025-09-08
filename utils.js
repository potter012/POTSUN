/** Custom Error for user input validation */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Parses a string of numbers into an array of floats.
 * Handles numbers separated by spaces, commas, or newlines.
 * @param {string} s The input string.
 * @returns {number[]} An array of numbers.
 */
export function parseNums(s) {
    if (!s || typeof s !== 'string') return [];
    return s
        .replace(/[,"']/g, ' ') // Replace commas and quotes with spaces
        .trim()
        .split(/\s+/) // Split by one or more whitespace characters
        .map(x => parseFloat(x))
        .filter(x => !isNaN(x)); // Filter out non-numeric results
}

/** Calculates the mean of an array of numbers. */
export function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

/** Calculates the median of an array of numbers. */
export function median(arr) { const s = arr.slice().sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

/**
 * Calculates the mode(s) of an array of numbers.
 * @param {number[]} arr The input array.
 * @returns {string|number[]} An array of modes, or a string if no clear mode.
 */
export function mode(arr) {
    if (arr.length === 0) return 'ไม่มีข้อมูล';
    const frequencies = arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    const maxFreq = Math.max(...Object.values(frequencies));
    if (maxFreq === 1) return 'ไม่มีโหมด'; // All values are unique

    const modes = Object.keys(frequencies)
        .filter(key => frequencies[key] === maxFreq)
        .map(Number);

    return modes.length > 1 ? `มีหลายโหมด: [${modes.join(', ')}]` : modes[0];
}

/** Calculates the population variance of an array of numbers. */
export function variance(arr) { if (arr.length === 0) return NaN; const mu = mean(arr); return arr.reduce((a, b) => a + (b - mu) ** 2, 0) / arr.length; }
/** Calculates the population standard deviation of an array of numbers. */
export function stddev(arr) { return Math.sqrt(variance(arr)); }
/** Calculates the sample variance of an array of numbers. */
export function sampleVariance(arr) { if (arr.length < 2) return NaN; const mu = mean(arr); return arr.reduce((a, b) => a + (b - mu) ** 2, 0) / (arr.length - 1); }
export function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}
export function combinations(n, k) {
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;
    let res = 1;
    for (let i = 1; i <= k; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
}
export function gcd(a, b) { while(b) { [a, b] = [b, a % b]; } return a; }
export function solveIRR(cashFlows, guess = 0.1) {
    const MAX_ITER = 100;
    const TOLERANCE = 1e-7;
    let x0 = guess;

    for (let i = 0; i < MAX_ITER; i++) {
        let npv = 0;
        let derivative = 0;
        cashFlows.forEach((cf, t) => {
            npv += cf / Math.pow(1 + x0, t);
            if (t > 0) {
                derivative -= t * cf / Math.pow(1 + x0, t + 1);
            }
        });

        if (Math.abs(npv) < TOLERANCE) return x0; // Success
        if (Math.abs(derivative) < 1e-12) return null; // Avoid division by zero or a very small number
        
        const x1 = x0 - npv / derivative; // Newton-Raphson step
        if (Math.abs(x1 - x0) < TOLERANCE) return x1; // Converged
        x0 = x1;
    }
    return null; // Failed to converge
}

export function linearRegression(x, y) {
    const n = x.length;
    const mean_x = mean(x);
    const mean_y = mean(y);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (x[i] - mean_x) * (y[i] - mean_y);
        denominator += (x[i] - mean_x) ** 2;
    }

    if (denominator === 0) {
        // This happens if all x values are the same.
        return null;
    }

    const slope = numerator / denominator;
    const intercept = mean_y - slope * mean_x;

    return { slope, intercept };
}
