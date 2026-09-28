$body = @{
    username_or_email = "organizer"
    password = "OrganizerPassword123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host "Logged in successfully"

$updateBody = @{
    submission_end_date = "2026-09-29T18:00:00"
} | ConvertTo-Json

$updateResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/events/d60ce86a-7098-44c3-a8ee-301d0f11167d" -Method Patch -Body $updateBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "Updated successfully"
$updateResponse
