# Test Script for PLOP Sorteos Backend API (Windows PowerShell)
# Uso: powershell -ExecutionPolicy Bypass -File test-api.ps1

$BASE_URL = "http://localhost:3000"
$RECAPTCHA_TOKEN = "HFYWpzchNVNT00TnxGT0BXTgkMOjYzSSE1HgcPDxQiIyp0M2USG24MKShTZC5Qdz4lVQYyEFlXY2pleEBCUiQ7IExTQlARNy0nZ0xvFxBcT2RzIS4ECDxEIS18fkRRQUdaSFRuPStZLioMBwAXYCs0InskGwsJFGU8R3xpA2J_WkI3QVZ4dVJFFGh7XUdYfDUwGxoOdB0yJlgpcT9bDB9qKSomJmwaN1glJBMwEA4AY0VAQG8vIUIsIhBQT1BdYX52MFApSkZRHiIxIS8GCDwwZVdoIkh2T11-FV9sQSpeaHp8DV9BYmE3XQp1IgsJFBU7Uio2ZWt4amZqRHgXEm0HDhwbOiMpXXlsTVBLRAglJFUTIWEHGB0HKz8lVHkNNUx_ehU0BRhwBRkFVDU-OiQ7IGNWXlBRUnpgHmY-ABByDiM0Ki5zCDwyLFRyRmZ-BRlxAhUqdHFzfj4JBGJARWVpOXskaG1TVF9kdCo2ERcjKCE2BikcEA4AEH9fbnJzYzUwbwoPAAMkIj51NnYCbQ"

Write-Host "=== PLOP Sorteos Backend API - Test Suite (Windows)" -ForegroundColor Cyan
Write-Host ""

# Function to make requests
function Invoke-TestRequest {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [hashtable]$Body
    )
    
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    Write-Host "$Method $Uri" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Method $Method -Uri $Uri `
            -Headers @{"Content-Type" = "application/json"} `
            -Body ($Body | ConvertTo-Json) -Verbose:$false
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Green
    } catch {
        Write-Host ($_.Exception.Response.StatusCode) -ForegroundColor Red
        Write-Host ($_ | ConvertTo-Json) -ForegroundColor Red
    }
    Write-Host ""
}

# Test 1: Health Check
Invoke-TestRequest -Name "Health Check" -Method "GET" `
    -Uri "$BASE_URL/api/health"

# Test 2: Valid promotional code
Invoke-TestRequest -Name "Valid Promotional Code" -Method "POST" `
    -Uri "$BASE_URL/api/validate-code" `
    -Body @{
        code = "6X85Y72D"
        fullName = "Diego Norel Vega"
        documentId = "71382231"
        email = "diego@gmail.com"
        phone = "990228575"
        product = "MAX-FL MEDIANO"
        recaptchaToken = $RECAPTCHA_TOKEN
    }

# Test 3: Invalid code (not found)
Invoke-TestRequest -Name "Invalid Code (not found)" -Method "POST" `
    -Uri "$BASE_URL/api/validate-code" `
    -Body @{
        code = "INVALID123"
        fullName = "Test User"
        documentId = "12345678"
        email = "test@example.com"
        phone = "1234567890"
        product = "TEST"
        recaptchaToken = $RECAPTCHA_TOKEN
    }

# Test 4: Missing required field
Invoke-TestRequest -Name "Missing Required Field" -Method "POST" `
    -Uri "$BASE_URL/api/validate-code" `
    -Body @{
        code = "6X85Y72D"
        documentId = "71382231"
        email = "diego@gmail.com"
        phone = "990228575"
        product = "MAX-FL MEDIANO"
        recaptchaToken = $RECAPTCHA_TOKEN
    }

# Test 5: Invalid email format
Invoke-TestRequest -Name "Invalid Email Format" -Method "POST" `
    -Uri "$BASE_URL/api/validate-code" `
    -Body @{
        code = "6X85Y72D"
        fullName = "Diego Norel Vega"
        documentId = "71382231"
        email = "not-an-email"
        phone = "990228575"
        product = "MAX-FL MEDIANO"
        recaptchaToken = $RECAPTCHA_TOKEN
    }

# Test 6: Non-numeric document ID
Invoke-TestRequest -Name "Non-Numeric Document ID" -Method "POST" `
    -Uri "$BASE_URL/api/validate-code" `
    -Body @{
        code = "6X85Y72D"
        fullName = "Diego Norel Vega"
        documentId = "ABC1234"
        email = "diego@gmail.com"
        phone = "990228575"
        product = "MAX-FL MEDIANO"
        recaptchaToken = $RECAPTCHA_TOKEN
    }

Write-Host "=== Tests Complete ===" -ForegroundColor Cyan
