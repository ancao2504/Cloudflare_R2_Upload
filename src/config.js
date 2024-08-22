"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudflareR2BucketName = exports.cloudflareR2SecretAccessKey = exports.cloudflareR2AccessKeyId = exports.cloudflareAccountId = void 0;
var _a = process.env, CLOUDFLARE_ACCOUNT_ID = _a.CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID = _a.CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY = _a.CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME = _a.CLOUDFLARE_R2_BUCKET_NAME;
if (!CLOUDFLARE_ACCOUNT_ID ||
    !CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !CLOUDFLARE_R2_BUCKET_NAME) {
    throw new Error('Missing environment variables.');
}
var cloudflareAccountId = CLOUDFLARE_ACCOUNT_ID;
exports.cloudflareAccountId = cloudflareAccountId;
var cloudflareR2AccessKeyId = CLOUDFLARE_R2_ACCESS_KEY_ID;
exports.cloudflareR2AccessKeyId = cloudflareR2AccessKeyId;
var cloudflareR2SecretAccessKey = CLOUDFLARE_R2_SECRET_ACCESS_KEY;
exports.cloudflareR2SecretAccessKey = cloudflareR2SecretAccessKey;
var cloudflareR2BucketName = CLOUDFLARE_R2_BUCKET_NAME;
exports.cloudflareR2BucketName = cloudflareR2BucketName;
