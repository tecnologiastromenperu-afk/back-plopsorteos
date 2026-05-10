#!/bin/bash

# Test Script for PLOP Sorteos Backend API
# Uso: bash test-api.sh

BASE_URL="http://localhost:3000"
RECAPTCHA_TOKEN="HFYWpzchNVNT00TnxGT0BXTgkMOjYzSSE1HgcPDxQiIyp0M2USG24MKShTZC5Qdz4lVQYyEFlXY2pleEBCUiQ7IExTQlARNy0nZ0xvFxBcT2RzIS4ECDxEIS18fkRRQUdaSFRuPStZLioMBwAXYCs0InskGwsJFGU8R3xpA2J_WkI3QVZ4dVJFFGh7XUdYfDUwGxoOdB0yJlgpcT9bDB9qKSomJmwaN1glJBMwEA4AY0VAQG8vIUIsIhBQT1BdYX52MFApSkZRHiIxIS8GCDwwZVdoIkh2T11-FV9sQSpeaHp8DV9BYmE3XQp1IgsJFBU7Uio2ZWt4amZqRHgXEm0HDhwbOiMpXXlsTVBLRAglJFUTIWEHGB0HKz8lVHkNNUx_ehU0BRhwBRkFVDU-OiQ7IGNWXlBRUnpgHmY-ABByDiM0Ki5zCDwyLFRyRmZ-BRlxAhUqdHFzfj4JBGJARWVpOXskaG1TVF9kdCo2ERcjKCE2BikcEA4AEH9fbnJzYzUwbwoPAAMkIj51NnYCbQ"

echo "=== PLOP Sorteos Backend API - Test Suite ==="
echo ""

# Test 1: Health Check
echo "TEST 1: Health Check"
echo "GET $BASE_URL/api/health"
curl -X GET "$BASE_URL/api/health" \
  -H "Content-Type: application/json"
echo -e "\n\n"

# Test 2: Valid promotional code
echo "TEST 2: Valid Promotional Code (should pass if code exists in DB)"
echo "POST $BASE_URL/api/validate-code"
curl -X POST "$BASE_URL/api/validate-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"6X85Y72D\",
    \"fullName\": \"Diego Norel Vega\",
    \"documentId\": \"71382231\",
    \"email\": \"diego@gmail.com\",
    \"phone\": \"990228575\",
    \"product\": \"MAX-FL MEDIANO\",
    \"recaptchaToken\": \"$RECAPTCHA_TOKEN\"
  }"
echo -e "\n\n"

# Test 3: Invalid code (not found)
echo "TEST 3: Invalid Code (not found in DB)"
echo "POST $BASE_URL/api/validate-code"
curl -X POST "$BASE_URL/api/validate-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"INVALID123\",
    \"fullName\": \"Test User\",
    \"documentId\": \"12345678\",
    \"email\": \"test@example.com\",
    \"phone\": \"1234567890\",
    \"product\": \"TEST\",
    \"recaptchaToken\": \"$RECAPTCHA_TOKEN\"
  }"
echo -e "\n\n"

# Test 4: Missing required field
echo "TEST 4: Missing Required Field (should fail validation)"
echo "POST $BASE_URL/api/validate-code"
curl -X POST "$BASE_URL/api/validate-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"6X85Y72D\",
    \"documentId\": \"71382231\",
    \"email\": \"diego@gmail.com\",
    \"phone\": \"990228575\",
    \"product\": \"MAX-FL MEDIANO\",
    \"recaptchaToken\": \"$RECAPTCHA_TOKEN\"
  }"
echo -e "\n\n"

# Test 5: Invalid email format
echo "TEST 5: Invalid Email Format (should fail validation)"
echo "POST $BASE_URL/api/validate-code"
curl -X POST "$BASE_URL/api/validate-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"6X85Y72D\",
    \"fullName\": \"Diego Norel Vega\",
    \"documentId\": \"71382231\",
    \"email\": \"not-an-email\",
    \"phone\": \"990228575\",
    \"product\": \"MAX-FL MEDIANO\",
    \"recaptchaToken\": \"$RECAPTCHA_TOKEN\"
  }"
echo -e "\n\n"

# Test 6: Non-numeric document ID
echo "TEST 6: Non-Numeric Document ID (should fail validation)"
echo "POST $BASE_URL/api/validate-code"
curl -X POST "$BASE_URL/api/validate-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"6X85Y72D\",
    \"fullName\": \"Diego Norel Vega\",
    \"documentId\": \"ABC1234\",
    \"email\": \"diego@gmail.com\",
    \"phone\": \"990228575\",
    \"product\": \"MAX-FL MEDIANO\",
    \"recaptchaToken\": \"$RECAPTCHA_TOKEN\"
  }"
echo -e "\n\n"

echo "=== Tests Complete ==="
