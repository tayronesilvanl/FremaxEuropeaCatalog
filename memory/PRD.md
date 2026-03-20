# FREMAX Catalog - PRD (Product Requirements Document)

## Original Problem Statement
Create a product catalog website for FREMAX automotive brake parts with comprehensive admin management.

## User Requirements
1. Public catalog with search by code, application (cascading dropdowns), measurements
2. English language interface
3. Admin link hidden (access via /#/admin/login)
4. Product datasheet with image gallery (arrows + thumbnails), tabs for specs/applications/cross-refs/logistics
5. Related products with common applications
6. Not found codes tracking
7. Admin product page with tabs (General, Specs, Applications, Cross Ref, Logistics)
8. Separate bulk imports for Applications, Cross References, Measurements, Logistics
9. Extended measurements per product line
10. Updated logistics with VPE, EAN code

## Application Model (Vehicle Applications)
Fields: **make**, **vehicle**, **model**, **start_year**, **end_year** (optional - blank = ongoing), **vehicle_type**

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI (HashRouter for SPA compatibility)
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT tokens for admin

## Admin Access
- URL: /#/admin/login
- Credentials: adminfleu / admin123

## What's Been Implemented

### 2026-03-06
- Public catalog with multi-type search
- Product datasheet with tabs
- Print-friendly datasheet page
- Related products by common applications
- Not found codes tracking
- Admin dashboard with stats
- Admin product detail page with 5 tabs
- Bulk import page with 5 import types
- Extended measurement fields per product line
- Updated logistics (weight, gross_weight, VPE, EAN, NCM, packaging)

### 2026-03-09
- HashRouter for SPA deployment compatibility (Render)
- Change Password feature (backend endpoint + admin UI dialog)
- Removed /api/admin/setup endpoint (security hardening)
- Auto-seeding admin user on server startup
- Removed "Made with Emergent" badge

### 2026-03-09 (Session 2)
- **Image Gallery**: Carousel with arrows + thumbnails on product datasheet page
- **Application Model Restructure**: Changed from brand/model/year_from/year_to to make/vehicle/model/start_year/end_year(optional)/vehicle_type
- **Cascading Dropdown Search**: Homepage APPLICATION tab with Make→Vehicle→Model cascading dropdowns
- **Admin forms updated**: Product detail page and dashboard ProductForm use new application fields
- **Bulk import updated**: CSV template now uses make,vehicle,model,start_year,end_year,vehicle_type
- **Print datasheet updated**: Shows new application columns
- **Admin credentials**: Changed default admin to adminfleu/admin123

## API Endpoints
- `GET /api/makes` - Get all unique vehicle makes
- `GET /api/vehicles/{make}` - Get vehicles for a make
- `GET /api/models/{make}/{vehicle}` - Get models for make+vehicle
- `GET /api/vehicle-types` - Get all vehicle types
- `POST /api/products/search` - Search products
- `GET /api/products/{id}` - Get product details
- `GET /api/products/{id}/related` - Get related products
- `POST /api/admin/login` - Admin login
- `POST /api/admin/change-password` - Change admin password
- `POST /api/admin/bulk/*` - Bulk import endpoints

## Next Tasks (P0/P1)
1. PDF datasheet generation
2. Image upload for products

## Backlog (P2)
3. API rate limiting on login endpoint
4. ERP integration API
5. Favorites/wishlist for customers
