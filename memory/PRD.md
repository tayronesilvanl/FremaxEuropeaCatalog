# FREMAX Catalog - PRD (Product Requirements Document)

## Original Problem Statement
Create a product catalog website for FREMAX automotive brake parts. Features include:
- Product search by original code, Part Number, or competitor code (cross-reference)
- Search by application (vehicle brand/model/year) or product measurements
- Product lines: Brake Discs, Drums, Pads, Shoes, Calipers
- Measurement filters: Pads (width, height, thickness), Discs (outer diameter, height, thickness, center hole, quantity of holes)
- Datasheet page showing photo, product drawing, all measurements, logistics info
- Product status: developed, not developed, in development, new in portfolio
- Admin area for product import (individual or bulk) - protected
- Public catalog without customer login

## User Requirements Added
- English language interface
- Admin link hidden from public (access via /admin/login only)
- "Open Datasheet" button that opens dedicated print-friendly page
- Related products section showing items with common applications
- Not found codes tracking system for admin visibility

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT tokens for admin

## User Personas
1. **B2B Customer/Mechanic**: Searches products by code/cross-reference/measurements, views datasheets
2. **Admin**: Manages products, imports bulk data, controls product status, monitors customer demand

## Core Requirements (Static)
- [x] Public product search without login
- [x] Search by code, cross-reference, application, measurements
- [x] Product datasheet with full specs
- [x] Admin authentication (JWT)
- [x] Product CRUD operations
- [x] Bulk import (JSON/CSV)
- [x] Product status management
- [x] Related products (common applications)
- [x] Not found codes tracking

## What's Been Implemented (2026-03-06)
- Complete FastAPI backend with 25+ endpoints
- MongoDB models for products, applications, cross-references, not found codes
- JWT authentication for admin
- React frontend with dark FREMAX theme (English)
- Search pages with multiple filter types
- Product datasheet with tabs (specs, applications, cross-refs, logistics)
- Dedicated print-friendly datasheet page (/datasheet/:id)
- Related products section on product page
- Admin dashboard with stats and product management
- Not found codes tracking and admin visibility
- Bulk import functionality

## Admin Access
- URL: /admin/login
- Credentials: admin / admin123

## Prioritized Backlog

### P0 (Critical)
- ✅ Product search
- ✅ Product datasheet
- ✅ Admin authentication
- ✅ Product CRUD
- ✅ Related products
- ✅ Not found codes tracking

### P1 (High)
- [ ] PDF export of datasheet
- [ ] Image upload for products
- [ ] Enhanced search algorithms

### P2 (Medium)
- [ ] User favorites/wishlist
- [ ] Quotation generation
- [ ] ERP integration API
- [ ] Email notifications

## Next Tasks
1. Implement PDF generation for datasheets
2. Add image upload functionality
3. Create ERP integration endpoints
4. Add favorites/wishlist for customers
