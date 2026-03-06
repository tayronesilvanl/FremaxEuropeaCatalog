import requests
import sys
import json
import time
from datetime import datetime

class AdminEnhancementTester:
    def __init__(self, base_url="https://product-datasheet.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_product_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")

            return success, response.json() if response.content and success else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def admin_login(self):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token received: {self.token[:20]}...")
            return True
        return False

    def test_admin_products_list(self):
        """Test admin products list endpoint"""
        success, response = self.run_test(
            "Admin Products List",
            "GET", 
            "admin/products",
            200
        )
        if success and 'items' in response:
            print(f"   📋 Found {len(response['items'])} products")
            if response['items']:
                self.test_product_id = response['items'][0].get('id')
                print(f"   🎯 Using product ID for tests: {self.test_product_id}")
        return success

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats", 
            200
        )
        if success:
            print(f"   📊 Total products: {response.get('total_products', 0)}")
        return success

    def test_product_detail(self):
        """Test getting product detail"""
        if not self.test_product_id:
            print("⏭️  Skipping product detail test - no product ID available")
            return False
            
        success, response = self.run_test(
            "Product Detail",
            "GET",
            f"products/{self.test_product_id}",
            200
        )
        if success:
            print(f"   🔍 Product: {response.get('part_number')} - {response.get('product_line')}")
        return success

    def test_create_product(self):
        """Test creating a new product"""
        test_product = {
            "part_number": f"TEST-{int(time.time())}",
            "product_line": "disc", 
            "description": "Test product for admin enhancement testing",
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
                    "manufacturer": "TEST",
                    "code": "TEST123"
                }
            ],
            "measurements": {
                "outer_diameter": 312.0,
                "thickness": 25.0,
                "center_hole": 65.0
            },
            "logistics": {
                "weight_kg": 4.5,
                "gross_weight_kg": 5.2,
                "vpe": 1,
                "ean_code": "1234567890123"
            }
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "admin/products",
            200,
            data=test_product
        )
        if success and 'id' in response:
            self.test_product_id = response['id']
            print(f"   ✨ Created product ID: {self.test_product_id}")
        return success

    def test_update_product(self):
        """Test updating a product"""
        if not self.test_product_id:
            print("⏭️  Skipping product update test - no product ID available")
            return False
            
        update_data = {
            "description": "Updated test product description",
            "measurements": {
                "outer_diameter": 315.0,
                "thickness": 28.0
            }
        }
        
        success, response = self.run_test(
            "Update Product",
            "PUT",
            f"admin/products/{self.test_product_id}",
            200,
            data=update_data
        )
        return success

    def test_product_applications(self):
        """Test product applications endpoints"""
        if not self.test_product_id:
            print("⏭️  Skipping applications test - no product ID available")
            return False

        # Add application
        app_data = {
            "brand": "Toyota",
            "model": "Corolla",
            "year_from": 2018,
            "year_to": 2023
        }
        
        success, response = self.run_test(
            "Add Product Application",
            "POST",
            f"admin/products/{self.test_product_id}/applications",
            200,
            data=app_data
        )
        return success

    def test_product_cross_references(self):
        """Test product cross references endpoints"""
        if not self.test_product_id:
            print("⏭️  Skipping cross references test - no product ID available")
            return False

        # Add cross reference
        ref_data = {
            "manufacturer": "Brembo",
            "code": "BR123"
        }
        
        success, response = self.run_test(
            "Add Product Cross Reference", 
            "POST",
            f"admin/products/{self.test_product_id}/cross-references",
            200,
            data=ref_data
        )
        return success

    def test_product_measurements(self):
        """Test product measurements endpoints"""
        if not self.test_product_id:
            print("⏭️  Skipping measurements test - no product ID available")
            return False

        # Update measurements
        measurements_data = {
            "outer_diameter": 320.0,
            "thickness": 30.0,
            "minimum_thickness": 28.0,
            "height": 50.0,
            "center_hole": 70.0,
            "quantity_holes": 5,
            "pcd": 112.0,
            "disc_type": "Internally ventilated",
            "drilled": False,
            "slotted": True
        }
        
        success, response = self.run_test(
            "Update Product Measurements",
            "PUT",
            f"admin/products/{self.test_product_id}/measurements",
            200,
            data=measurements_data
        )
        return success

    def test_product_logistics(self):
        """Test product logistics endpoints"""
        if not self.test_product_id:
            print("⏭️  Skipping logistics test - no product ID available")
            return False

        # Update logistics
        logistics_data = {
            "weight_kg": 5.2,
            "gross_weight_kg": 6.0,
            "packaging_width": 350.0,
            "packaging_height": 350.0, 
            "packaging_depth": 50.0,
            "ean_code": "7891234567890",
            "ncm": "8708.30.19",
            "vpe": 1,
            "country_of_origin": "Brazil"
        }
        
        success, response = self.run_test(
            "Update Product Logistics",
            "PUT",
            f"admin/products/{self.test_product_id}/logistics",
            200,
            data=logistics_data
        )
        return success

    def test_bulk_import_endpoints(self):
        """Test bulk import endpoints (without actual files)"""
        endpoints = [
            ("Bulk Applications Import", "admin/bulk/applications"),
            ("Bulk Cross References Import", "admin/bulk/cross-references"), 
            ("Bulk Measurements Import", "admin/bulk/measurements"),
            ("Bulk Logistics Import", "admin/bulk/logistics"),
            ("Bulk Products Import", "admin/products/bulk")
        ]
        
        results = []
        for name, endpoint in endpoints:
            # Test with empty request (should fail but endpoint should exist)
            success, response = self.run_test(
                f"{name} Endpoint Check",
                "POST",
                endpoint,
                422  # Expected to fail with validation error for missing file
            )
            results.append(success)
        
        return all(results)

    def cleanup_test_product(self):
        """Delete the test product"""
        if not self.test_product_id:
            print("⏭️  No test product to clean up")
            return True
            
        success, response = self.run_test(
            "Delete Test Product",
            "DELETE",
            f"admin/products/{self.test_product_id}",
            200
        )
        return success

def main():
    print("🚀 Starting FREMAX Admin Enhancement API Tests")
    print("=" * 60)
    
    tester = AdminEnhancementTester()
    
    # Login first
    if not tester.admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    # Run all tests
    tests = [
        tester.test_admin_stats,
        tester.test_admin_products_list,
        tester.test_product_detail,
        tester.test_create_product,
        tester.test_update_product,
        tester.test_product_applications,
        tester.test_product_cross_references, 
        tester.test_product_measurements,
        tester.test_product_logistics,
        tester.test_bulk_import_endpoints,
        tester.cleanup_test_product
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"🎯 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All admin enhancement API tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check details above")
        return 1

if __name__ == "__main__":
    sys.exit(main())