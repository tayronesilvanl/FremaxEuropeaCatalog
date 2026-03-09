"""
FREMAX Admin Authentication and Password Change Tests
Tests admin login, change password feature, and removed setup endpoint
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://parts-preview-1.preview.emergentagent.com')

class TestAdminSetupRemoved:
    """Verify /api/admin/setup endpoint was removed"""
    
    def test_admin_setup_returns_404(self):
        """Test that /api/admin/setup returns 404 (was removed)"""
        response = requests.post(f"{BASE_URL}/api/admin/setup", json={
            "username": "newadmin",
            "password": "newpass123"
        })
        # Should return 404 since endpoint was removed
        assert response.status_code == 404, f"Expected 404 but got {response.status_code}"
        print("✅ /api/admin/setup correctly returns 404 (removed)")


class TestAdminLogin:
    """Admin login authentication tests"""
    
    def test_login_success(self):
        """Test successful login with admin/admin123"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed with status {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert data["token_type"] == "bearer", "Token type should be bearer"
        print(f"✅ Login successful, token received: {data['access_token'][:20]}...")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials fails"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401 but got {response.status_code}"
        print("✅ Invalid credentials correctly rejected with 401")
    
    def test_login_missing_fields(self):
        """Test login with missing fields fails"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin"
        })
        assert response.status_code == 422, f"Expected 422 but got {response.status_code}"
        print("✅ Missing password correctly rejected with 422")


class TestAdminChangePassword:
    """Change password feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not authenticate - skipping password tests")
    
    def test_change_password_wrong_current(self, auth_token):
        """Test change password with wrong current password fails"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/admin/change-password", 
            json={
                "current_password": "wrongcurrent",
                "new_password": "newpass123"
            },
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        data = response.json()
        assert "incorrect" in data.get("detail", "").lower(), f"Error message should mention incorrect password: {data}"
        print("✅ Wrong current password correctly rejected with 400")
    
    def test_change_password_too_short(self, auth_token):
        """Test change password with too short new password fails"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/admin/change-password", 
            json={
                "current_password": "admin123",
                "new_password": "short"  # Less than 6 chars
            },
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        data = response.json()
        assert "6 characters" in data.get("detail", ""), f"Error should mention minimum length: {data}"
        print("✅ Short password correctly rejected with 400")
    
    def test_change_password_without_auth(self):
        """Test change password without auth fails"""
        response = requests.post(f"{BASE_URL}/api/admin/change-password", 
            json={
                "current_password": "admin123",
                "new_password": "newpass123"
            }
        )
        assert response.status_code == 403, f"Expected 403 but got {response.status_code}"
        print("✅ Unauthenticated change password rejected with 403")
    
    def test_change_password_success_and_revert(self, auth_token):
        """Test full change password flow and revert back to admin123"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Step 1: Change password to temporary one
        new_temp_password = "temppass123"
        response = requests.post(f"{BASE_URL}/api/admin/change-password", 
            json={
                "current_password": "admin123",
                "new_password": new_temp_password
            },
            headers=headers
        )
        assert response.status_code == 200, f"Password change failed with {response.status_code}: {response.text}"
        data = response.json()
        assert "successfully" in data.get("message", "").lower(), f"Success message expected: {data}"
        print("✅ Password changed to temporary password successfully")
        
        # Step 2: Verify login with new password works
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": new_temp_password
        })
        assert login_response.status_code == 200, f"Login with new password failed: {login_response.status_code}"
        new_token = login_response.json().get("access_token")
        print("✅ Login with new password works")
        
        # Step 3: Verify old password no longer works
        old_login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert old_login_response.status_code == 401, f"Old password should not work: {old_login_response.status_code}"
        print("✅ Old password correctly rejected")
        
        # Step 4: Revert back to admin123
        revert_headers = {"Authorization": f"Bearer {new_token}"}
        revert_response = requests.post(f"{BASE_URL}/api/admin/change-password", 
            json={
                "current_password": new_temp_password,
                "new_password": "admin123"
            },
            headers=revert_headers
        )
        assert revert_response.status_code == 200, f"Password revert failed: {revert_response.status_code}"
        print("✅ Password reverted back to admin123")
        
        # Step 5: Verify original password works again
        final_login = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert final_login.status_code == 200, f"Original password should work: {final_login.status_code}"
        print("✅ Original password admin123 works again")


class TestAdminEndpoints:
    """Test other admin endpoints with authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not authenticate")
    
    def test_admin_stats(self, auth_token):
        """Test admin stats endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200, f"Stats failed with {response.status_code}"
        
        data = response.json()
        assert "total_products" in data
        assert "by_product_line" in data
        print(f"✅ Admin stats: {data['total_products']} total products")
    
    def test_admin_products_list(self, auth_token):
        """Test admin products list endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/products", headers=headers)
        assert response.status_code == 200, f"Products list failed with {response.status_code}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✅ Admin products: {data['total']} products found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
