/**
 * jwt.js — JWT Configuration
 *
 * JWT_SECRET: the secret key used to sign tokens.
 * JWT_EXPIRES_IN: how long a token stays valid.
 *
 * In production, store JWT_SECRET in an environment variable,
 * never hard-code it in source code.
 */

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "queuecare_super_secret_key_2024",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
};
