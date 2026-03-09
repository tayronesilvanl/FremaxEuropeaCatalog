# FREMAX Catalog - PRD (Product Requirements Document)

## Original Problem Statement
Create a product catalog website for FREMAX automotive brake parts with comprehensive admin management.

## User Requirements
1. Public catalog with search by code, application, measurements
2. English language interface
3. Admin link hidden (access via /#/admin/login)
4. Product datasheet with "Open Datasheet" button
5. Related products with common applications
6. Not found codes tracking
7. Admin product page with tabs (General, Specs, Applications, Cross Ref, Logistics)
8. Separate bulk imports for Applications, Cross References, Measurements, Logistics
9. Extended measurements per product line
10. Updated logistics with VPE, EAN code

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI (HashRouter for SPA compatibility)
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT tokens for admin

## Measurement Fields by Product Line

### Brake Disc
- outer_diameter, thickness, minimum_thickness, height, center_hole
- quantity_holes, pcd, disc_type (Solid/Internally ventilated/Externally ventilated)
- drilled, slotted, fitting_position, disc_drum, paired_part_number

### Brake Drum
- outer_diameter, inner_diameter, maximum_diameter, height
- offset, inner_hole, quantity_holes, fitting_position

### Brake Pad
- width, height, thickness
- acoustic_wear_warning, electronic_wear_sensor, extra_components_included

### Brake Shoe
- thickness, drum_diameter, width

### Brake Caliper
- piston_size, fitting_position, electronic_brake_caliper, paired_part_number

## Admin Access
- URL: /#/admin/login
- Credentials: admin / admin123

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
- Removed "Create Default Admin" button from login page

## Next Tasks
1. PDF datasheet generation
2. Image upload functionality
3. API rate limiting on login endpoint
4. ERP integration API
5. Favorites/wishlist for customers
