#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method, endpoint, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.text();
        
        console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
        if (result) {
            try {
                const json = JSON.parse(result);
                console.log(`   Response:`, json);
            } catch {
                console.log(`   Response:`, result.substring(0, 100));
            }
        }
    } catch (error) {
        console.log(`❌ ${method} ${endpoint} - Error:`, error.message);
    }
}

async function runTests() {
    console.log('🧪 Testing API Endpoints...\n');
    
    // Test GET endpoints
    await testEndpoint('GET', '/api/users');
    await testEndpoint('GET', '/api/unsubscribes');
    await testEndpoint('GET', '/api/preferences');
    
    // Test POST endpoints
    await testEndpoint('POST', '/api/preferences', {
        email: 'test@example.com',
        token: 'testtoken123456789',
        preferences: {
            name: 'Test User',
            launchNotifications: true,
            industryInsights: false,
            specialOffers: true,
            newsletter: true,
            frequency: 'weekly'
        }
    });
    
    await testEndpoint('POST', '/api/unsubscribe', {
        email: 'test@example.com',
        token: 'testtoken123456789',
        reason: 'Testing unsubscribe functionality'
    });
    
    console.log('\n🎯 Test completed!');
}

runTests();
