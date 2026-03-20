"""
FREMAX Catalog API Tests - Iteration 5
Testing: Admin auth, cascading dropdowns, product CRUD, new application fields
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test Data
ADMIN_USERNAME = "adminfleu"
ADMIN_PASSWORD = "admin123"
TEST_PRODUCT_PREFIX = "TEST_ITER5_"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """API root endpoint returns message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root returns: {data['message']}")
    
    def test_product_lines_endpoint(self):
        """Product lines endpoint returns array"""
        response = requests.get(f"{BASE_URL}/api/product-lines")
        assert response.status_code == 200
        lines = response.json()
        assert isinstance(lines, list)
        assert "disc" in lines
        assert "pad" in lines
        print(f"✓ Product lines: {lines}")
    
    def test_statuses_endpoint(self):
        """Statuses endpoint returns status options"""
        response = requests.get(f"{BASE_URL}/api/statuses")
        assert response.status_code == 200
        statuses = response.json()
        assert isinstance(statuses, list)
        assert len(statuses) > 0
        print(f"✓ Statuses: {[s['value'] for s in statuses]}")


class TestAdminAuth:
    """Admin authentication tests with new credentials"""
    
    def test_admin_login_success(self):
        """Admin login with adminfleu/admin123 returns token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print(f"✓ Admin login successful, token: {data['access_token'][:30]}...")
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with wrong credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_admin_login_new_credentials_work(self):
        """New adminfleu/admin123 credentials work"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "adminfleu",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("access_token") is not None
        print("✓ New adminfleu credentials work correctly")
    
    def test_admin_setup_removed(self):
        """GET /api/admin/setup should return 404 (removed)"""
        response = requests.get(f"{BASE_URL}/api/admin/setup")
        assert response.status_code == 404
        print("✓ /api/admin/setup correctly returns 404")


class TestChangePassword:
    """Change password functionality tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_change_password_wrong_current(self, admin_token):
        """Change password with wrong current password fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/change-password",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"current_password": "wrongpassword", "new_password": "newpass123"}
        )
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()
        print("✓ Wrong current password correctly rejected")
    
    def test_change_password_short_new(self, admin_token):
        """Change password with short new password fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/change-password",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"current_password": ADMIN_PASSWORD, "new_password": "12345"}  # 5 chars
        )
        assert response.status_code == 400
        assert "6 characters" in response.json()["detail"]
        print("✓ Short password correctly rejected")


class TestCascadingDropdowns:
    """Tests for Make → Vehicle → Model cascading dropdowns"""
    
    def test_makes_endpoint(self):
        """GET /api/makes returns array"""
        response = requests.get(f"{BASE_URL}/api/makes")
        assert response.status_code == 200
        makes = response.json()
        assert isinstance(makes, list)
        print(f"✓ Makes endpoint returns: {makes}")
    
    def test_vehicles_endpoint(self):
        """GET /api/vehicles/{make} returns array"""
        response = requests.get(f"{BASE_URL}/api/vehicles/Toyota")
        assert response.status_code == 200
        vehicles = response.json()
        assert isinstance(vehicles, list)
        print(f"✓ Vehicles for Toyota: {vehicles}")
    
    def test_models_endpoint(self):
        """GET /api/models/{make}/{vehicle} returns array"""
        response = requests.get(f"{BASE_URL}/api/models/Toyota/Camry")
        assert response.status_code == 200
        models = response.json()
        assert isinstance(models, list)
        print(f"✓ Models for Toyota/Camry: {models}")
    
    def test_vehicle_types_endpoint(self):
        """GET /api/vehicle-types returns array"""
        response = requests.get(f"{BASE_URL}/api/vehicle-types")
        assert response.status_code == 200
        types = response.json()
        assert isinstance(types, list)
        print(f"✓ Vehicle types: {types}")


class TestSearchEndpoints:
    """Test search with new application fields"""
    
    def test_search_by_make(self):
        """Search by make returns results"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "make": "Toyota"
        })
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✓ Search by make returned {data['total']} items")
    
    def test_search_by_vehicle(self):
        """Search by vehicle returns results"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "vehicle": "Camry"
        })
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✓ Search by vehicle returned {data['total']} items")
    
    def test_search_by_year(self):
        """Search by year returns results"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "make": "Toyota",
            "vehicle": "Camry",
            "year": 2020
        })
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✓ Search by year returned {data['total']} items")
    
    def test_search_by_vehicle_type(self):
        """Search by vehicle_type works"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "vehicle_type": "Passenger Car"
        })
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✓ Search by vehicle_type returned {data['total']} items")


class TestProductCRUD:
    """Product CRUD operations with new application fields"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_create_product_new_fields(self, admin_token):
        """Create product with new application fields (make, vehicle, model, start_year, end_year, vehicle_type)"""
        product_data = {
            "part_number": f"{TEST_PRODUCT_PREFIX}DISC-001",
            "product_line": "disc",
            "description": "Test Disc with new application fields",
            "status": "developed",
            "applications": [{
                "make": "Volkswagen",
                "vehicle": "Golf",
                "model": "GTI",
                "start_year": 2015,
                "end_year": 2024,
                "vehicle_type": "Passenger Car"
            }]
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=product_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["part_number"] == product_data["part_number"].upper()
        assert len(data["applications"]) == 1
        app = data["applications"][0]
        assert app["make"] == "Volkswagen"
        assert app["vehicle"] == "Golf"
        assert app["model"] == "GTI"
        assert app["start_year"] == 2015
        assert app["end_year"] == 2024
        assert app["vehicle_type"] == "Passenger Car"
        print(f"✓ Created product with new fields: {data['part_number']}")
        return data
    
    def test_create_product_optional_end_year(self, admin_token):
        """Create product with optional end_year (ongoing production)"""
        product_data = {
            "part_number": f"{TEST_PRODUCT_PREFIX}PAD-001",
            "product_line": "pad",
            "description": "Test Pad with no end year",
            "status": "new",
            "applications": [{
                "make": "Ford",
                "vehicle": "Mustang",
                "model": "GT",
                "start_year": 2020,
                "end_year": None,  # Optional - ongoing
                "vehicle_type": "Sports Car"
            }]
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=product_data
        )
        assert response.status_code == 200
        data = response.json()
        app = data["applications"][0]
        assert app["end_year"] is None
        print(f"✓ Created product with optional end_year (None)")
    
    def test_get_product_by_id(self, admin_token):
        """Get product by ID shows new application fields"""
        # First create a product
        product_data = {
            "part_number": f"{TEST_PRODUCT_PREFIX}GET-001",
            "product_line": "drum",
            "description": "Test for GET",
            "applications": [{
                "make": "Honda",
                "vehicle": "Civic",
                "model": "Si",
                "start_year": 2017,
                "end_year": 2023,
                "vehicle_type": "Sedan"
            }]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=product_data
        )
        product_id = create_response.json()["id"]
        
        # Now GET it
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        app = data["applications"][0]
        assert "make" in app
        assert "vehicle" in app
        assert "model" in app
        assert "start_year" in app
        assert "end_year" in app
        assert "vehicle_type" in app
        print(f"✓ GET product returns all new application fields")
    
    def test_admin_get_products(self, admin_token):
        """Admin GET products endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✓ Admin products list: {data['total']} total")


class TestCleanup:
    """Cleanup test products"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_cleanup_test_products(self, admin_token):
        """Delete all test products created during testing"""
        # Get all products
        response = requests.get(
            f"{BASE_URL}/api/admin/products?page_size=100",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        products = response.json()["items"]
        
        deleted = 0
        for product in products:
            if product["part_number"].startswith(TEST_PRODUCT_PREFIX) or product["part_number"].startswith("TEST-"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/products/{product['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if delete_response.status_code == 200:
                    deleted += 1
        
        print(f"✓ Cleaned up {deleted} test products")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
