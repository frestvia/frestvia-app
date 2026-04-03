#!/usr/bin/env python3
"""
Backend API Testing for Forgetly - Shared Lists Functionality
Tests all shared lists endpoints with proper authentication
"""

import requests
import json
import sys
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

def main():
    print("🚀 Starting Shared Lists API Testing...")
    print(f"Backend URL: {BASE_URL}")
    
    # Test authentication
    token, user = test_auth_and_get_token()
    if not token:
        print("❌ Authentication failed. Cannot proceed with shared lists testing.")
        return False
    
    # Test shared lists endpoints
    results = test_shared_lists_endpoints(token, user)
    
    # Print summary
    success = results.summary()
    
    if success:
        print("\n🎉 All shared lists tests passed!")
    else:
        print(f"\n⚠️  Some tests failed. Check the details above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)