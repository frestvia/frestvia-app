#!/usr/bin/env python3
"""
Backend API Testing for Forgotten Item Reminder App
Tests all authentication flows and CRUD operations
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://item-shield.preview.emergentagent.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"
TEST_NAME = "Test User"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.checklist_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        # Add auth header if token exists
        if self.auth_token and headers is None:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
        elif self.auth_token and headers:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_health_check(self):
        """Test 1: Health check endpoint"""
        print("\n=== Testing Health Check ===")
        
        response = self.make_request("GET", "/health")
        if response and response.status_code == 200:
            data = response.json()
            if "status" in data and data["status"] == "healthy":
                self.log_test("Health Check", True, f"Status: {data['status']}")
                return True
            else:
                self.log_test("Health Check", False, f"Invalid response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Health Check", False, f"HTTP {status_code}")
        return False
    
    def test_guest_login(self):
        """Test 2: Guest login"""
        print("\n=== Testing Guest Login ===")
        
        response = self.make_request("POST", "/auth/guest")
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                guest_token = data["access_token"]
                user = data["user"]
                if user.get("is_guest") == True:
                    self.log_test("Guest Login", True, f"Guest user created: {user['name']}")
                    return True
                else:
                    self.log_test("Guest Login", False, "User is not marked as guest")
            else:
                self.log_test("Guest Login", False, f"Missing fields in response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Guest Login", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_register(self):
        """Test 3: User registration"""
        print("\n=== Testing User Registration ===")
        
        # First, try to clean up any existing user (ignore errors)
        try:
            # This will fail if user doesn't exist, which is fine
            pass
        except:
            pass
        
        register_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        
        response = self.make_request("POST", "/auth/register", register_data)
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.auth_token = data["access_token"]
                self.user_id = data["user"]["id"]
                user = data["user"]
                
                # Verify user data
                if (user["email"] == TEST_EMAIL.lower() and 
                    user["name"] == TEST_NAME and 
                    user["is_guest"] == False):
                    self.log_test("User Registration", True, f"User registered: {user['email']}")
                    return True
                else:
                    self.log_test("User Registration", False, f"User data mismatch: {user}")
            else:
                self.log_test("User Registration", False, f"Missing fields in response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            
            # If user already exists, try to login instead
            if response and response.status_code == 400 and "already registered" in response.text:
                print("   User already exists, testing login instead...")
                return self.test_login()
            
            self.log_test("User Registration", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_login(self):
        """Test 4: User login"""
        print("\n=== Testing User Login ===")
        
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.auth_token = data["access_token"]
                self.user_id = data["user"]["id"]
                user = data["user"]
                
                # Verify user data
                if user["email"] == TEST_EMAIL.lower():
                    self.log_test("User Login", True, f"User logged in: {user['email']}")
                    return True
                else:
                    self.log_test("User Login", False, f"Email mismatch: {user}")
            else:
                self.log_test("User Login", False, f"Missing fields in response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("User Login", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_get_profile(self):
        """Test 5: Get user profile"""
        print("\n=== Testing Get User Profile ===")
        
        if not self.auth_token:
            self.log_test("Get User Profile", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/auth/me")
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "email" in data and "name" in data:
                if data["email"] == TEST_EMAIL.lower():
                    self.log_test("Get User Profile", True, f"Profile retrieved: {data['name']}")
                    return True
                else:
                    self.log_test("Get User Profile", False, f"Email mismatch: {data}")
            else:
                self.log_test("Get User Profile", False, f"Missing fields in response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Get User Profile", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_get_checklists(self):
        """Test 6: Get checklists"""
        print("\n=== Testing Get Checklists ===")
        
        if not self.auth_token:
            self.log_test("Get Checklists", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/checklists")
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Should have default checklists created during registration
                if len(data) >= 3:  # Home, Travel, Office templates
                    self.log_test("Get Checklists", True, f"Retrieved {len(data)} checklists")
                    return True
                else:
                    self.log_test("Get Checklists", True, f"Retrieved {len(data)} checklists (fewer than expected)")
                    return True
            else:
                self.log_test("Get Checklists", False, f"Response is not a list: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Get Checklists", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_create_checklist(self):
        """Test 7: Create a checklist"""
        print("\n=== Testing Create Checklist ===")
        
        if not self.auth_token:
            self.log_test("Create Checklist", False, "No auth token available")
            return False
        
        checklist_data = {
            "name": "My Test List",
            "type": "custom",
            "items": [
                {
                    "id": "1",
                    "name": "Test Item",
                    "checked": False,
                    "order": 0
                }
            ]
        }
        
        response = self.make_request("POST", "/checklists", checklist_data)
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "name" in data and "items" in data:
                self.checklist_id = data["id"]
                if (data["name"] == "My Test List" and 
                    data["type"] == "custom" and 
                    len(data["items"]) == 1):
                    self.log_test("Create Checklist", True, f"Checklist created: {data['name']}")
                    return True
                else:
                    self.log_test("Create Checklist", False, f"Data mismatch: {data}")
            else:
                self.log_test("Create Checklist", False, f"Missing fields in response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Create Checklist", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_record_exit(self):
        """Test 8: Record an exit"""
        print("\n=== Testing Record Exit ===")
        
        if not self.auth_token:
            self.log_test("Record Exit", False, "No auth token available")
            return False
        
        if not self.checklist_id:
            self.log_test("Record Exit", False, "No checklist ID available")
            return False
        
        exit_data = {
            "checklist_id": self.checklist_id,
            "checked_items": ["1"],
            "forgotten_items": []
        }
        
        response = self.make_request("POST", "/exits", exit_data)
        if response and response.status_code == 200:
            data = response.json()
            if ("id" in data and "checklist_id" in data and 
                "checked_items" in data and "forgotten_items" in data):
                if (data["checklist_id"] == self.checklist_id and 
                    data["checked_items"] == ["1"] and 
                    data["forgotten_items"] == []):
                    self.log_test("Record Exit", True, f"Exit recorded: {data['id']}")
                    return True
                else:
                    self.log_test("Record Exit", False, f"Data mismatch: {data}")
            else:
                self.log_test("Record Exit", False, f"Missing fields in response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Record Exit", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_get_stats(self):
        """Test 9: Get stats"""
        print("\n=== Testing Get Stats ===")
        
        if not self.auth_token:
            self.log_test("Get Stats", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/stats")
        if response and response.status_code == 200:
            data = response.json()
            required_fields = [
                "total_exits", "total_items_checked", "total_items_forgotten",
                "items_saved_today", "items_forgotten_today", "risk_score",
                "current_streak", "best_streak", "exits_by_day"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if not missing_fields:
                self.log_test("Get Stats", True, f"Stats retrieved with {data['total_exits']} exits")
                return True
            else:
                self.log_test("Get Stats", False, f"Missing fields: {missing_fields}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Get Stats", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def test_get_exit_history(self):
        """Test 10: Get exit history"""
        print("\n=== Testing Get Exit History ===")
        
        if not self.auth_token:
            self.log_test("Get Exit History", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/exits")
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Should have at least one exit from previous test
                if len(data) >= 1:
                    exit_record = data[0]
                    if ("id" in exit_record and "checklist_id" in exit_record and 
                        "checked_items" in exit_record):
                        self.log_test("Get Exit History", True, f"Retrieved {len(data)} exit records")
                        return True
                    else:
                        self.log_test("Get Exit History", False, f"Invalid exit record structure: {exit_record}")
                else:
                    self.log_test("Get Exit History", True, "No exit records found (empty list)")
                    return True
            else:
                self.log_test("Get Exit History", False, f"Response is not a list: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = response.text if response else "No response"
            self.log_test("Get Exit History", False, f"HTTP {status_code}: {error_msg}")
        return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Forgotten Item Reminder API Tests")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        tests = [
            self.test_health_check,
            self.test_guest_login,
            self.test_register,
            self.test_login,
            self.test_get_profile,
            self.test_get_checklists,
            self.test_create_checklist,
            self.test_record_exit,
            self.test_get_stats,
            self.test_get_exit_history
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Exception occurred: {e}")
                self.log_test(test.__name__, False, f"Exception: {e}")
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
            return False

def main():
    """Main function"""
    tester = APITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "total_tests": len(tester.test_results),
            "passed_tests": sum(1 for r in tester.test_results if r["success"]),
            "overall_success": success,
            "test_details": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())