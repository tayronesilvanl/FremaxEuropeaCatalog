import requests
import sys
import json
from datetime import datetime

class FremaxAPITester:
    def __init__(self, base_url="https://product-datasheet.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "status": status
        }
        self.test_results.append(result)
        print(f"{status} - {test_name}: {details}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                except json.JSONDecodeError:
                    response_data = {}
                self.log_result(name, True, f"Status: {response.status_code}")
                return True, response_data
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_result(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_admin_setup(self):
        """Test admin setup"""
        success, response = self.run_test("Admin Setup", "POST", "admin/setup", 200)
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login", 
            "POST", 
            "admin/login", 
            200,
            {"username": "admin", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_result("Token Obtained", True, "Admin token stored")
            return True
        else:
            self.log_result("Token Obtained", False, "No token in response")
            return False

    def test_get_products(self):
        """Test getting products list"""
        return self.run_test("Get Products", "GET", "products", 200)

    def test_get_product_lines(self):
        """Test product lines endpoint"""
        return self.run_test("Get Product Lines", "GET", "product-lines", 200)

    def test_get_statuses(self):
        """Test statuses endpoint"""
        return self.run_test("Get Statuses", "GET", "statuses", 200)

    def test_get_brands(self):
        """Test brands endpoint"""
        return self.run_test("Get Brands", "GET", "brands", 200)

    def test_search_empty(self):
        """Test search with empty query"""
        success, response = self.run_test(
            "Search Empty Query", 
            "POST", 
            "search", 
            200,
            {}
        )
        return success

    def test_search_by_product_line(self):
        """Test search by product line"""
        success, response = self.run_test(
            "Search by Product Line", 
            "POST", 
            "search", 
            200,
            {"product_line": "disc"}
        )
        return success

    def test_admin_stats(self):
        """Test admin stats (requires auth)"""
        if not self.token:
            self.log_result("Admin Stats", False, "No token available")
            return False
        
        return self.run_test("Admin Stats", "GET", "admin/stats", 200)

    def test_admin_products(self):
        """Test admin products list (requires auth)"""
        if not self.token:
            self.log_result("Admin Products", False, "No token available")
            return False
        
        return self.run_test("Admin Products", "GET", "admin/products", 200)

    def test_create_product(self):
        """Test creating a product (requires auth)"""
        if not self.token:
            self.log_result("Create Product", False, "No token available")
            return False

        test_product = {
            "part_number": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "product_line": "disc",
            "description": "Test brake disc for automated testing",
            "status": "developed",
            "applications": [
                {
                    "brand": "Test Brand",
                    "model": "Test Model",
                    "year_from": 2020,
                    "year_to": 2024
                }
            ],
            "cross_references": [
                {
                    "manufacturer": "Test Manufacturer",
                    "code": "TEST123"
                }
            ],
            "measurements": {
                "outer_diameter": 280.0,
                "thickness": 22.0,
                "center_hole": 65.0,
                "quantity_holes": 5
            },
            "notes": "Test product created by automated testing"
        }

        success, response = self.run_test(
            "Create Product", 
            "POST", 
            "admin/products", 
            200,
            test_product
        )
        
        if success and 'id' in response:
            # Store product ID for potential cleanup
            self.test_product_id = response['id']
            self.test_product_part_number = response['part_number']
            return True
        return success

    def test_get_created_product(self):
        """Test getting the created product"""
        if not hasattr(self, 'test_product_id'):
            self.log_result("Get Created Product", False, "No test product created")
            return False

        success, response = self.run_test(
            "Get Created Product", 
            "GET", 
            f"products/{self.test_product_id}", 
            200
        )
        
        if success and response.get('part_number') == self.test_product_part_number:
            self.log_result("Product Data Validation", True, "Product data matches")
            return True
        elif success:
            self.log_result("Product Data Validation", False, "Product data mismatch")
            return False
        return success

    def test_search_created_product(self):
        """Test searching for the created product"""
        if not hasattr(self, 'test_product_part_number'):
            self.log_result("Search Created Product", False, "No test product created")
            return False

        success, response = self.run_test(
            "Search Created Product", 
            "POST", 
            "search", 
            200,
            {"query": self.test_product_part_number}
        )
        
        if success and response.get('items') and len(response['items']) > 0:
            found_product = False
            for item in response['items']:
                if item.get('part_number') == self.test_product_part_number:
                    found_product = True
                    break
            
            if found_product:
                self.log_result("Product Search Validation", True, "Product found in search")
                return True
            else:
                self.log_result("Product Search Validation", False, "Product not found in search results")
                return False
        elif success:
            self.log_result("Product Search Validation", False, "No products returned in search")
            return False
        return success

    def cleanup_test_product(self):
        """Clean up the test product"""
        if hasattr(self, 'test_product_id') and self.token:
            success, _ = self.run_test(
                "Cleanup Test Product", 
                "DELETE", 
                f"admin/products/{self.test_product_id}", 
                200
            )
            return success
        return True

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting FREMAX Catalog API Tests")
        print("=" * 60)
        
        # Basic API tests
        print("\n📡 Testing Basic API Endpoints")
        self.test_root_endpoint()
        self.test_get_product_lines()
        self.test_get_statuses()
        self.test_get_brands()
        self.test_get_products()
        
        # Search tests
        print("\n🔍 Testing Search Functionality")
        self.test_search_empty()
        self.test_search_by_product_line()
        
        # Admin setup and auth tests
        print("\n👤 Testing Admin Authentication")
        self.test_admin_setup()
        
        if self.test_admin_login():
            print("\n🔐 Testing Authenticated Endpoints")
            self.test_admin_stats()
            self.test_admin_products()
            
            print("\n📦 Testing Product CRUD Operations")
            if self.test_create_product():
                self.test_get_created_product()
                self.test_search_created_product()
                self.cleanup_test_product()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 Test Results Summary")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! API is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Check the details above.")
            
            # Print failed tests
            failed_tests = [t for t in self.test_results if not t['success']]
            if failed_tests:
                print("\nFailed Tests:")
                for test in failed_tests:
                    print(f"  - {test['test']}: {test['details']}")
            
            return 1

def main():
    tester = FremaxAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())