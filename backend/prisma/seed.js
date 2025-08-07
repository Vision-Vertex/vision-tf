"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/v1';
async function waitForAPI() {
    console.log('🔄 Waiting for API to be ready...');
    const maxAttempts = 30;
    const delayMs = 2000;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await axios_1.default.get(`${API_BASE_URL}/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log('✅ API is ready!');
                return;
            }
        }
        catch (error) {
            console.log(`⏳ Attempt ${attempt}/${maxAttempts}: API not ready yet, retrying in ${delayMs / 1000}s...`);
            if (attempt === maxAttempts) {
                throw new Error('API failed to start within expected time');
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}
async function createUser(user, userType) {
    try {
        console.log(`🔄 Creating ${userType} user: ${user.email}`);
        const response = await axios_1.default.post(`${API_BASE_URL}/auth/signup`, user, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        if (response.status === 201) {
            console.log(`✅ ${userType} user created successfully: ${user.email}`);
        }
        else {
            console.log(`⚠️  ${userType} user creation returned status: ${response.status}`);
        }
    }
    catch (error) {
        if (error.response?.status === 409) {
            console.log(`✅ ${userType} user already exists: ${user.email}`);
        }
        else {
            console.error(`❌ Failed to create ${userType} user:`, error.response?.data || error.message);
            throw error;
        }
    }
}
function getUserFromEnv(prefix) {
    const firstname = process.env[`SEED_${prefix}_FIRSTNAME`];
    const lastname = process.env[`SEED_${prefix}_LASTNAME`];
    const username = process.env[`SEED_${prefix}_USERNAME`];
    const email = process.env[`SEED_${prefix}_EMAIL`];
    const password = process.env[`SEED_${prefix}_PASSWORD`];
    if (!firstname || !lastname || !username || !email || !password) {
        console.log(`⚠️  Skipping ${prefix} user - missing required environment variables`);
        return null;
    }
    return {
        firstname,
        lastname,
        username,
        email,
        password,
        middlename: process.env[`SEED_${prefix}_MIDDLENAME`] || undefined,
        preferredLanguage: process.env[`SEED_${prefix}_PREFERRED_LANGUAGE`] || 'en',
        timezone: process.env[`SEED_${prefix}_TIMEZONE`] || 'UTC'
    };
}
async function main() {
    console.log('🌱 Starting API-based database seeding...');
    try {
        await waitForAPI();
        const adminUser = getUserFromEnv('ADMIN');
        const developerUser = getUserFromEnv('DEVELOPER');
        const clientUser = getUserFromEnv('CLIENT');
        if (adminUser) {
            await createUser(adminUser, 'Admin');
        }
        if (developerUser) {
            await createUser(developerUser, 'Developer');
        }
        if (clientUser) {
            await createUser(clientUser, 'Client');
        }
        console.log('🎉 Database seeding completed successfully!');
        console.log('');
        console.log('📋 Test Users Created:');
        if (adminUser)
            console.log(`   Admin: ${adminUser.email} / ${adminUser.password}`);
        if (developerUser)
            console.log(`   Developer: ${developerUser.email} / ${developerUser.password}`);
        if (clientUser)
            console.log(`   Client: ${clientUser.email} / ${clientUser.password}`);
        console.log('');
        console.log('🔗 Test the API at: http://localhost:3000/api');
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=seed.js.map