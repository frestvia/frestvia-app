#!/usr/bin/env python3
"""
Backend API Testing for Forgetly - Password Reset Functionality
Tests all password reset endpoints with comprehensive scenarios
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://item-shield.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_success(self, test_name):
        print(f"✅ {test_name}")
        self.passed += 1
        
    def log_failure(self, test_name, error):
        print(f"❌ {test_name}: {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILURES:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

def test_auth_and_get_token():
    """Test guest authentication and return token"""
    print("\n🔐 Testing Authentication...")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/guest", headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user")
            
            if token and user:
                print(f"✅ Guest authentication successful")
                print(f"   User ID: {user.get('id')}")
                print(f"   User Name: {user.get('name')}")
                return token, user
            else:
                print(f"❌ Invalid response format: {data}")
                return None, None
        else:
            print(f"❌ Auth failed: {response.status_code} - {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Auth error: {str(e)}")
        return None, None

def test_shared_lists_endpoints(token, user):
    """Test all shared lists endpoints"""
    results = TestResults()
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    print(f"\n📋 Testing Shared Lists Endpoints...")
    print(f"Using token for user: {user.get('name')} ({user.get('id')})")
    
    # Test data
    test_list_data = {
        "title": "Test Grocery List",
        "emoji": None,
        "items": [
            {"text": "Tomatoes", "emoji": "🍅"},
            {"text": "Milk", "emoji": "🥛"},
            {"text": "Bread", "emoji": "🍞"}
        ]
    }
    
    shared_list_id = None
    share_code = None
    item_id = None
    
    # 1. Create Shared List
    try:
        response = requests.post(f"{BASE_URL}/shared-lists", 
                               headers=auth_headers, 
                               json=test_list_data)
        
        if response.status_code == 200:
            data = response.json()
            shared_list_id = data.get("id")
            share_code = data.get("share_code")
            items = data.get("items", [])
            
            if shared_list_id and share_code and len(items) == 3:
                if len(share_code) == 6 and data.get("status") == "pending":
                    results.log_success("Create Shared List - Returns 6-char share_code and pending status")
                    item_id = items[0].get("id") if items else None
                else:
                    results.log_failure("Create Shared List", f"Invalid share_code length ({len(share_code)}) or status ({data.get('status')})")
            else:
                results.log_failure("Create Shared List", f"Missing required fields: id={shared_list_id}, share_code={share_code}, items_count={len(items)}")
        else:
            results.log_failure("Create Shared List", f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Create Shared List", f"Exception: {str(e)}")
    
    # 2. Get All Shared Lists
    try:
        response = requests.get(f"{BASE_URL}/shared-lists", headers=auth_headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 1:
                found_list = any(sl.get("id") == shared_list_id for sl in data)
                if found_list:
                    results.log_success("Get All Shared Lists - Returns user's shared lists")
                else:
                    results.log_failure("Get All Shared Lists", "Created list not found in response")
            else:
                results.log_failure("Get All Shared Lists", f"Invalid response format or empty: {data}")
        else:
            results.log_failure("Get All Shared Lists", f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Get All Shared Lists", f"Exception: {str(e)}")
    
    # 3. Get Shared List Detail
    if shared_list_id:
        try:
            response = requests.get(f"{BASE_URL}/shared-lists/{shared_list_id}", headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("id") == shared_list_id and 
                    data.get("title") == "Test Grocery List" and
                    len(data.get("items", [])) == 3 and
                    len(data.get("members", [])) >= 1):
                    results.log_success("Get Shared List Detail - Returns full list with items and members")
                else:
                    results.log_failure("Get Shared List Detail", f"Invalid response data: {data}")
            else:
                results.log_failure("Get Shared List Detail", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Get Shared List Detail", f"Exception: {str(e)}")
    
    # 4. Toggle Item
    if shared_list_id and item_id:
        try:
            response = requests.put(f"{BASE_URL}/shared-lists/{shared_list_id}/toggle/{item_id}", 
                                  headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                toggled_item = next((item for item in items if item.get("id") == item_id), None)
                
                if toggled_item and user.get("id") in toggled_item.get("checked_by", []):
                    if data.get("status") == "in_progress":
                        results.log_success("Toggle Item - Toggles checked state and auto-updates status")
                    else:
                        results.log_failure("Toggle Item", f"Status not updated correctly: {data.get('status')}")
                else:
                    results.log_failure("Toggle Item", f"Item not toggled correctly: {toggled_item}")
            else:
                results.log_failure("Toggle Item", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Toggle Item", f"Exception: {str(e)}")
    
    # 5. Add Item
    if shared_list_id:
        try:
            new_item_data = {"text": "Eggs", "emoji": "🥚"}
            response = requests.post(f"{BASE_URL}/shared-lists/{shared_list_id}/items", 
                                   headers=auth_headers, 
                                   json=new_item_data)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                new_item = next((item for item in items if item.get("text") == "Eggs"), None)
                
                if new_item and new_item.get("emoji") == "🥚":
                    results.log_success("Add Item - Successfully adds new item to list")
                else:
                    results.log_failure("Add Item", f"New item not found or incorrect: {new_item}")
            else:
                results.log_failure("Add Item", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Add Item", f"Exception: {str(e)}")
    
    # 6. Set Reminder
    if shared_list_id:
        try:
            reminder_data = {"type": "after_minutes", "minutes": 15}
            response = requests.post(f"{BASE_URL}/shared-lists/{shared_list_id}/reminder", 
                                   headers=auth_headers, 
                                   json=reminder_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") and data.get("reminder"):
                    reminder = data.get("reminder")
                    if (reminder.get("type") == "after_minutes" and 
                        reminder.get("minutes") == 15 and
                        reminder.get("user_id") == user.get("id")):
                        results.log_success("Set Reminder - Successfully sets reminder")
                    else:
                        results.log_failure("Set Reminder", f"Invalid reminder data: {reminder}")
                else:
                    results.log_failure("Set Reminder", f"Invalid response format: {data}")
            else:
                results.log_failure("Set Reminder", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Set Reminder", f"Exception: {str(e)}")
    
    # 7. Join via Code (create second user first)
    try:
        # Create second guest user
        response = requests.post(f"{BASE_URL}/auth/guest", headers=HEADERS)
        if response.status_code == 200:
            second_user_data = response.json()
            second_token = second_user_data.get("access_token")
            second_user = second_user_data.get("user")
            second_auth_headers = {**HEADERS, "Authorization": f"Bearer {second_token}"}
            
            if share_code:
                # Join with second user
                response = requests.post(f"{BASE_URL}/shared-lists/join?share_code={share_code}", 
                                       headers=second_auth_headers)
                
                if response.status_code == 200:
                    data = response.json()
                    members = data.get("members", [])
                    second_user_member = next((m for m in members if m.get("id") == second_user.get("id")), None)
                    
                    if second_user_member and second_user_member.get("role") == "member":
                        results.log_success("Join via Code - Successfully adds user to members")
                    else:
                        results.log_failure("Join via Code", f"Second user not added as member: {members}")
                else:
                    results.log_failure("Join via Code", f"HTTP {response.status_code}: {response.text}")
            else:
                results.log_failure("Join via Code", "No share code available from create test")
        else:
            results.log_failure("Join via Code", "Could not create second user for testing")
            
    except Exception as e:
        results.log_failure("Join via Code", f"Exception: {str(e)}")
    
    # 8. Delete Shared List (test leave first, then delete)
    if shared_list_id:
        try:
            # First test leaving (with second user if available)
            if 'second_auth_headers' in locals():
                response = requests.delete(f"{BASE_URL}/shared-lists/{shared_list_id}", 
                                         headers=second_auth_headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("message") == "Left shared list":
                        print("✅ Leave Shared List - Successfully leaves list")
                    else:
                        print(f"⚠️  Leave response: {data}")
            
            # Then test delete (with original creator)
            response = requests.delete(f"{BASE_URL}/shared-lists/{shared_list_id}", 
                                     headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Shared list deleted":
                    results.log_success("Delete Shared List - Successfully deletes list")
                else:
                    results.log_failure("Delete Shared List", f"Unexpected message: {data.get('message')}")
            else:
                results.log_failure("Delete Shared List", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Delete Shared List", f"Exception: {str(e)}")
    
    # Test error handling
    print(f"\n🔍 Testing Error Handling...")
    
    # Test invalid list ID
    try:
        response = requests.get(f"{BASE_URL}/shared-lists/invalid-id", headers=auth_headers)
        if response.status_code == 404:
            results.log_success("Error Handling - Returns 404 for invalid list ID")
        else:
            results.log_failure("Error Handling", f"Expected 404, got {response.status_code}")
    except Exception as e:
        results.log_failure("Error Handling", f"Exception: {str(e)}")
    
    # Test invalid share code
    try:
        response = requests.post(f"{BASE_URL}/shared-lists/join?share_code=INVALID", headers=auth_headers)
        if response.status_code == 404:
            results.log_success("Error Handling - Returns 404 for invalid share code")
        else:
            results.log_failure("Error Handling", f"Expected 404, got {response.status_code}")
    except Exception as e:
        results.log_failure("Error Handling", f"Exception: {str(e)}")
    
    return results

def test_password_reset_endpoints():
    """Test all password reset endpoints with comprehensive scenarios"""
    results = TestResults()
    
    print(f"\n🔐 Testing Password Reset Endpoints...")
    
    # Test credentials - use timestamp to avoid rate limiting
    import time
    timestamp = str(int(time.time()))
    test_email = f"testuser{timestamp}@test.com"
    test_password = "testpass123"
    
    # First, create a test user to use for password reset
    print(f"Creating test user: {test_email}")
    try:
        register_response = requests.post(f"{BASE_URL}/auth/register", 
                                        headers=HEADERS, 
                                        json={"email": test_email, "password": test_password, "name": "Test User"})
        
        if register_response.status_code == 200:
            print(f"✅ Test user created successfully")
        else:
            print(f"⚠️  Could not create test user: {register_response.text}")
            # Fall back to existing premium user but with delay
            test_email = "premium@test.com"
            test_password = "premium123"
            print(f"Using existing user: {test_email}")
            
    except Exception as e:
        print(f"⚠️  Exception creating test user: {str(e)}")
        test_email = "premium@test.com"
        test_password = "premium123"
    
    # Test 1: Forgot Password - Happy Path (existing email)
    try:
        response = requests.post(f"{BASE_URL}/auth/forgot-password", 
                               headers=HEADERS, 
                               json={"email": test_email})
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") == True and 
                "dev_code" in data and 
                len(data["dev_code"]) == 6 and
                data["dev_code"].isdigit()):
                results.log_success("Forgot Password - Happy path: existing email returns success with 6-digit dev_code")
                dev_code = data["dev_code"]
            else:
                results.log_failure("Forgot Password - Happy path", f"Invalid response format: {data}")
                dev_code = None
        else:
            results.log_failure("Forgot Password - Happy path", f"HTTP {response.status_code}: {response.text}")
            dev_code = None
            
    except Exception as e:
        results.log_failure("Forgot Password - Happy path", f"Exception: {str(e)}")
        dev_code = None
    
    # Test 2: Forgot Password - Non-existent email (no enumeration)
    try:
        response = requests.post(f"{BASE_URL}/auth/forgot-password", 
                               headers=HEADERS, 
                               json={"email": "nonexistent@test.com"})
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") == True and 
                "dev_code" not in data):
                results.log_success("Forgot Password - Non-existent email: same success message, no dev_code")
            else:
                results.log_failure("Forgot Password - Non-existent email", f"Should not return dev_code: {data}")
        else:
            results.log_failure("Forgot Password - Non-existent email", f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Forgot Password - Non-existent email", f"Exception: {str(e)}")
    
    # Test 3: Forgot Password - Invalid email format
    try:
        response = requests.post(f"{BASE_URL}/auth/forgot-password", 
                               headers=HEADERS, 
                               json={"email": "invalid-email"})
        
        if response.status_code == 422:  # Validation error
            results.log_success("Forgot Password - Invalid email format: returns validation error")
        else:
            results.log_failure("Forgot Password - Invalid email format", f"Expected 422, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Forgot Password - Invalid email format", f"Exception: {str(e)}")
    
    # Test 4: Rate limiting (send 4 requests)
    try:
        rate_limit_email = "ratelimit@test.com"
        codes_received = 0
        
        for i in range(4):
            response = requests.post(f"{BASE_URL}/auth/forgot-password", 
                                   headers=HEADERS, 
                                   json={"email": rate_limit_email})
            
            if response.status_code == 200:
                data = response.json()
                if "dev_code" in data:
                    codes_received += 1
        
        # Should receive codes for first 3 requests, but not the 4th
        if codes_received <= 3:
            results.log_success("Forgot Password - Rate limiting: 4th request returns success but no code")
        else:
            results.log_failure("Forgot Password - Rate limiting", f"Received {codes_received} codes, expected <= 3")
            
    except Exception as e:
        results.log_failure("Forgot Password - Rate limiting", f"Exception: {str(e)}")
    
    # Test 5: Verify Reset Code - Happy Path
    reset_token = None
    if dev_code:
        try:
            response = requests.post(f"{BASE_URL}/auth/verify-reset-code", 
                                   headers=HEADERS, 
                                   json={"email": test_email, "code": dev_code})
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("success") == True and 
                    "reset_token" in data and
                    len(data["reset_token"]) > 10):
                    results.log_success("Verify Reset Code - Happy path: correct code returns reset_token")
                    reset_token = data["reset_token"]
                else:
                    results.log_failure("Verify Reset Code - Happy path", f"Invalid response format: {data}")
            else:
                results.log_failure("Verify Reset Code - Happy path", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Verify Reset Code - Happy path", f"Exception: {str(e)}")
    
    # Test 6: Verify Reset Code - Wrong code
    try:
        response = requests.post(f"{BASE_URL}/auth/verify-reset-code", 
                               headers=HEADERS, 
                               json={"email": test_email, "code": "000000"})
        
        if response.status_code == 400:
            data = response.json()
            if "Incorrect code" in data.get("detail", "") and "attempts remaining" in data.get("detail", ""):
                results.log_success("Verify Reset Code - Wrong code: returns 400 with attempts count")
            else:
                results.log_failure("Verify Reset Code - Wrong code", f"Invalid error message: {data}")
        else:
            results.log_failure("Verify Reset Code - Wrong code", f"Expected 400, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Verify Reset Code - Wrong code", f"Exception: {str(e)}")
    
    # Test 7: Verify Reset Code - Expired/invalid code
    try:
        response = requests.post(f"{BASE_URL}/auth/verify-reset-code", 
                               headers=HEADERS, 
                               json={"email": "nonexistent@test.com", "code": "123456"})
        
        if response.status_code == 400:
            data = response.json()
            if "expired or is invalid" in data.get("detail", ""):
                results.log_success("Verify Reset Code - Expired/invalid: returns 400 with expired message")
            else:
                results.log_failure("Verify Reset Code - Expired/invalid", f"Invalid error message: {data}")
        else:
            results.log_failure("Verify Reset Code - Expired/invalid", f"Expected 400, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Verify Reset Code - Expired/invalid", f"Exception: {str(e)}")
    
    # Test 8: Reset Password - Happy Path
    if reset_token:
        try:
            new_password = "newpass123"
            response = requests.post(f"{BASE_URL}/auth/reset-password", 
                                   headers=HEADERS, 
                                   json={"reset_token": reset_token, "new_password": new_password})
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True:
                    results.log_success("Reset Password - Happy path: valid token + strong password succeeds")
                    
                    # Test login with new password
                    login_response = requests.post(f"{BASE_URL}/auth/login", 
                                                 headers=HEADERS, 
                                                 json={"email": test_email, "password": new_password})
                    
                    if login_response.status_code == 200:
                        results.log_success("Reset Password - Login with new password works")
                        
                        # Reset password back to original
                        # Get new code
                        forgot_response = requests.post(f"{BASE_URL}/auth/forgot-password", 
                                                      headers=HEADERS, 
                                                      json={"email": test_email})
                        
                        if forgot_response.status_code == 200:
                            forgot_data = forgot_response.json()
                            if "dev_code" in forgot_data:
                                # Verify new code
                                verify_response = requests.post(f"{BASE_URL}/auth/verify-reset-code", 
                                                              headers=HEADERS, 
                                                              json={"email": test_email, "code": forgot_data["dev_code"]})
                                
                                if verify_response.status_code == 200:
                                    verify_data = verify_response.json()
                                    if "reset_token" in verify_data:
                                        # Reset back to original password
                                        reset_back_response = requests.post(f"{BASE_URL}/auth/reset-password", 
                                                                           headers=HEADERS, 
                                                                           json={"reset_token": verify_data["reset_token"], "new_password": test_password})
                                        
                                        if reset_back_response.status_code == 200:
                                            results.log_success("Reset Password - Successfully reset back to original password")
                                        else:
                                            results.log_failure("Reset Password - Reset back", f"Failed to reset back: {reset_back_response.text}")
                    else:
                        results.log_failure("Reset Password - Login with new password", f"Login failed: {login_response.text}")
                else:
                    results.log_failure("Reset Password - Happy path", f"Invalid response format: {data}")
            else:
                results.log_failure("Reset Password - Happy path", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            results.log_failure("Reset Password - Happy path", f"Exception: {str(e)}")
    
    # Test 9: Reset Password - Weak password (< 8 chars)
    try:
        response = requests.post(f"{BASE_URL}/auth/reset-password", 
                               headers=HEADERS, 
                               json={"reset_token": "dummy-token", "new_password": "weak"})
        
        if response.status_code == 400:
            data = response.json()
            if "at least 8 characters" in data.get("detail", ""):
                results.log_success("Reset Password - Weak password (< 8 chars): returns 400")
            else:
                results.log_failure("Reset Password - Weak password", f"Invalid error message: {data}")
        else:
            results.log_failure("Reset Password - Weak password", f"Expected 400, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Reset Password - Weak password", f"Exception: {str(e)}")
    
    # Test 10: Reset Password - No letter
    try:
        response = requests.post(f"{BASE_URL}/auth/reset-password", 
                               headers=HEADERS, 
                               json={"reset_token": "dummy-token", "new_password": "12345678"})
        
        if response.status_code == 400:
            data = response.json()
            if "at least 1 letter and 1 number" in data.get("detail", ""):
                results.log_success("Reset Password - No letter: returns 400")
            else:
                results.log_failure("Reset Password - No letter", f"Invalid error message: {data}")
        else:
            results.log_failure("Reset Password - No letter", f"Expected 400, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Reset Password - No letter", f"Exception: {str(e)}")
    
    # Test 11: Reset Password - No number
    try:
        response = requests.post(f"{BASE_URL}/auth/reset-password", 
                               headers=HEADERS, 
                               json={"reset_token": "dummy-token", "new_password": "password"})
        
        if response.status_code == 400:
            data = response.json()
            if "at least 1 letter and 1 number" in data.get("detail", ""):
                results.log_success("Reset Password - No number: returns 400")
            else:
                results.log_failure("Reset Password - No number", f"Invalid error message: {data}")
        else:
            results.log_failure("Reset Password - No number", f"Expected 400, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Reset Password - No number", f"Exception: {str(e)}")
    
    # Test 12: Reset Password - Invalid/expired token
    try:
        response = requests.post(f"{BASE_URL}/auth/reset-password", 
                               headers=HEADERS, 
                               json={"reset_token": "invalid-token", "new_password": "validpass123"})
        
        if response.status_code == 400:
            data = response.json()
            if "expired or is invalid" in data.get("detail", ""):
                results.log_success("Reset Password - Invalid token: returns 400")
            else:
                results.log_failure("Reset Password - Invalid token", f"Invalid error message: {data}")
        else:
            results.log_failure("Reset Password - Invalid token", f"Expected 400, got {response.status_code}: {response.text}")
            
    except Exception as e:
        results.log_failure("Reset Password - Invalid token", f"Exception: {str(e)}")
    
    return results

def main():
    print("🚀 Starting Password Reset API Testing...")
    print(f"Backend URL: {BASE_URL}")
    
    # Test password reset endpoints
    results = test_password_reset_endpoints()
    
    # Print summary
    success = results.summary()
    
    if success:
        print("\n🎉 All password reset tests passed!")
    else:
        print(f"\n⚠️  Some tests failed. Check the details above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)