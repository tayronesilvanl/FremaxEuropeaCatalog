from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import json
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'fremax-catalog-secret-key-2024')
JWT_ALGORITHM = 'HS256'

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== MODELS ==========

class AdminCreate(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Application(BaseModel):
    make: str
    vehicle: str
    model: str = ""
    start_year: int = 0
    end_year: Optional[int] = None
    vehicle_type: str = ""

class CrossReference(BaseModel):
    manufacturer: str
    code: str

class MeasurementsDisc(BaseModel):
    outer_diameter: Optional[float] = None
    thickness: Optional[float] = None
    minimum_thickness: Optional[float] = None
    height: Optional[float] = None
    center_hole: Optional[float] = None
    quantity_holes: Optional[int] = None
    pcd: Optional[float] = None  # Pitch Circle Diameter
    disc_type: Optional[str] = None  # Solid, Internally ventilated, Externally ventilated
    drilled: Optional[bool] = None
    slotted: Optional[bool] = None
    fitting_position: Optional[str] = None  # Front/Rear/Front Left/Front Right/Rear Left/Rear Right
    disc_drum: Optional[bool] = None
    paired_part_number: Optional[str] = None

class MeasurementsPad(BaseModel):
    width: Optional[float] = None
    height: Optional[float] = None
    thickness: Optional[float] = None
    acoustic_wear_warning: Optional[bool] = None
    electronic_wear_sensor: Optional[bool] = None
    extra_components_included: Optional[bool] = None

class MeasurementsDrum(BaseModel):
    outer_diameter: Optional[float] = None
    inner_diameter: Optional[float] = None
    maximum_diameter: Optional[float] = None
    height: Optional[float] = None
    offset: Optional[float] = None
    inner_hole: Optional[float] = None
    quantity_holes: Optional[int] = None
    fitting_position: Optional[str] = None

class MeasurementsShoe(BaseModel):
    thickness: Optional[float] = None
    drum_diameter: Optional[float] = None
    width: Optional[float] = None

class MeasurementsCaliper(BaseModel):
    piston_size: Optional[float] = None
    fitting_position: Optional[str] = None  # Front/Rear/Front Left/Front Right/Rear Left/Rear Right
    electronic_brake_caliper: Optional[bool] = None
    paired_part_number: Optional[str] = None

class LogisticsInfo(BaseModel):
    weight_kg: Optional[float] = None
    gross_weight_kg: Optional[float] = None
    packaging_width: Optional[float] = None
    packaging_height: Optional[float] = None
    packaging_depth: Optional[float] = None
    ean_code: Optional[str] = None
    ncm: Optional[str] = None
    vpe: Optional[int] = None  # Quantity per package
    country_of_origin: Optional[str] = None

class ProductBase(BaseModel):
    part_number: str
    product_line: str  # disc, drum, pad, shoe, caliper
    description: str
    status: str = "developed"  # developed, not_developed, in_development, new
    applications: List[Application] = []
    cross_references: List[CrossReference] = []
    measurements: Dict[str, Any] = {}
    logistics: Optional[LogisticsInfo] = None
    image_url: Optional[str] = None
    drawing_url: Optional[str] = None
    notes: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductUpdate(BaseModel):
    part_number: Optional[str] = None
    product_line: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    applications: Optional[List[Application]] = None
    cross_references: Optional[List[CrossReference]] = None
    measurements: Optional[Dict[str, Any]] = None
    logistics: Optional[LogisticsInfo] = None
    image_url: Optional[str] = None
    drawing_url: Optional[str] = None
    notes: Optional[str] = None

class SearchQuery(BaseModel):
    query: Optional[str] = None
    product_line: Optional[str] = None
    make: Optional[str] = None
    vehicle: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vehicle_type: Optional[str] = None
    # Disc measurements
    outer_diameter_min: Optional[float] = None
    outer_diameter_max: Optional[float] = None
    disc_thickness_min: Optional[float] = None
    disc_thickness_max: Optional[float] = None
    center_hole: Optional[float] = None
    quantity_holes: Optional[int] = None
    # Pad measurements
    pad_width_min: Optional[float] = None
    pad_width_max: Optional[float] = None
    pad_height_min: Optional[float] = None
    pad_height_max: Optional[float] = None
    pad_thickness_min: Optional[float] = None
    pad_thickness_max: Optional[float] = None

class PaginatedResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int

# ========== AUTH HELPERS ==========

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc).timestamp() + 86400  # 24h
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== PUBLIC ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "FREMAX Catalog API"}

@api_router.get("/products", response_model=PaginatedResponse)
async def get_products(
    page: int = 1,
    page_size: int = 20,
    product_line: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if product_line:
        query["product_line"] = product_line
    if status:
        query["status"] = status
    
    total = await db.products.count_documents(query)
    skip = (page - 1) * page_size
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(page_size).to_list(page_size)
    
    return PaginatedResponse(
        items=products,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/products/part/{part_number}")
async def get_product_by_part_number(part_number: str):
    product = await db.products.find_one({"part_number": part_number.upper()}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/search", response_model=PaginatedResponse)
async def search_products(search: SearchQuery, page: int = 1, page_size: int = 20):
    query = {}
    
    # Text search on part number and cross references
    if search.query:
        search_upper = search.query.upper()
        query["$or"] = [
            {"part_number": {"$regex": search_upper, "$options": "i"}},
            {"cross_references.code": {"$regex": search_upper, "$options": "i"}},
            {"description": {"$regex": search.query, "$options": "i"}}
        ]
    
    # Product line filter
    if search.product_line:
        query["product_line"] = search.product_line
    
    # Application filter
    if search.make or search.vehicle or search.model or search.year or search.vehicle_type:
        app_query = {}
        if search.make:
            app_query["applications.make"] = {"$regex": search.make, "$options": "i"}
        if search.vehicle:
            app_query["applications.vehicle"] = {"$regex": search.vehicle, "$options": "i"}
        if search.model:
            app_query["applications.model"] = {"$regex": search.model, "$options": "i"}
        if search.vehicle_type:
            app_query["applications.vehicle_type"] = {"$regex": search.vehicle_type, "$options": "i"}
        if search.year:
            app_query["$and"] = [
                {"applications.start_year": {"$lte": search.year}},
                {"$or": [
                    {"applications.end_year": {"$gte": search.year}},
                    {"applications.end_year": None},
                    {"applications.end_year": {"$exists": False}}
                ]}
            ]
        query.update(app_query)
    
    # Disc measurements
    if search.outer_diameter_min or search.outer_diameter_max:
        if search.outer_diameter_min:
            query["measurements.outer_diameter"] = {"$gte": search.outer_diameter_min}
        if search.outer_diameter_max:
            query.setdefault("measurements.outer_diameter", {})["$lte"] = search.outer_diameter_max
    
    if search.disc_thickness_min or search.disc_thickness_max:
        if search.disc_thickness_min:
            query["measurements.thickness"] = {"$gte": search.disc_thickness_min}
        if search.disc_thickness_max:
            query.setdefault("measurements.thickness", {})["$lte"] = search.disc_thickness_max
    
    if search.center_hole:
        query["measurements.center_hole"] = search.center_hole
    
    if search.quantity_holes:
        query["measurements.quantity_holes"] = search.quantity_holes
    
    # Pad measurements
    if search.pad_width_min or search.pad_width_max:
        if search.pad_width_min:
            query["measurements.width"] = {"$gte": search.pad_width_min}
        if search.pad_width_max:
            query.setdefault("measurements.width", {})["$lte"] = search.pad_width_max
    
    if search.pad_height_min or search.pad_height_max:
        if search.pad_height_min:
            query["measurements.height"] = {"$gte": search.pad_height_min}
        if search.pad_height_max:
            query.setdefault("measurements.height", {})["$lte"] = search.pad_height_max
    
    if search.pad_thickness_min or search.pad_thickness_max:
        if search.pad_thickness_min:
            query["measurements.thickness"] = {"$gte": search.pad_thickness_min}
        if search.pad_thickness_max:
            query.setdefault("measurements.thickness", {})["$lte"] = search.pad_thickness_max
    
    total = await db.products.count_documents(query)
    skip = (page - 1) * page_size
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(page_size).to_list(page_size)
    
    return PaginatedResponse(
        items=products,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1
    )

@api_router.get("/makes")
async def get_makes():
    """Get all unique vehicle makes"""
    pipeline = [
        {"$unwind": "$applications"},
        {"$group": {"_id": "$applications.make"}},
        {"$sort": {"_id": 1}}
    ]
    makes = await db.products.aggregate(pipeline).to_list(1000)
    return [m["_id"] for m in makes if m["_id"]]

@api_router.get("/vehicles/{make}")
async def get_vehicles(make: str):
    """Get all vehicles for a specific make"""
    pipeline = [
        {"$unwind": "$applications"},
        {"$match": {"applications.make": {"$regex": f"^{make}$", "$options": "i"}}},
        {"$group": {"_id": "$applications.vehicle"}},
        {"$sort": {"_id": 1}}
    ]
    vehicles = await db.products.aggregate(pipeline).to_list(1000)
    return [v["_id"] for v in vehicles if v["_id"]]

@api_router.get("/models/{make}/{vehicle}")
async def get_models_for_vehicle(make: str, vehicle: str):
    """Get all models for a specific make and vehicle"""
    pipeline = [
        {"$unwind": "$applications"},
        {"$match": {
            "applications.make": {"$regex": f"^{make}$", "$options": "i"},
            "applications.vehicle": {"$regex": f"^{vehicle}$", "$options": "i"}
        }},
        {"$group": {"_id": "$applications.model"}},
        {"$sort": {"_id": 1}}
    ]
    models = await db.products.aggregate(pipeline).to_list(1000)
    return [m["_id"] for m in models if m["_id"]]

@api_router.get("/vehicle-types")
async def get_vehicle_types():
    """Get all vehicle types"""
    pipeline = [
        {"$unwind": "$applications"},
        {"$match": {"applications.vehicle_type": {"$ne": ""}}},
        {"$group": {"_id": "$applications.vehicle_type"}},
        {"$sort": {"_id": 1}}
    ]
    types = await db.products.aggregate(pipeline).to_list(100)
    return [t["_id"] for t in types if t["_id"]]

@api_router.get("/product-lines")
async def get_product_lines():
    """Get all product lines"""
    return ["disc", "drum", "pad", "shoe", "caliper"]

@api_router.get("/statuses")
async def get_statuses():
    """Get all product statuses"""
    return [
        {"value": "developed", "label": "Developed"},
        {"value": "not_developed", "label": "Not Developed"},
        {"value": "in_development", "label": "In Development"},
        {"value": "new", "label": "New in Portfolio"}
    ]

# ========== NOT FOUND CODES TRACKING ==========

class NotFoundCode(BaseModel):
    code: str
    search_count: int = 1
    first_searched: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_searched: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_addresses: List[str] = []

@api_router.post("/track-not-found")
async def track_not_found_code(code: str):
    """Track codes that customers search but don't find"""
    if not code or len(code) < 2:
        return {"status": "ignored"}
    
    code_upper = code.upper().strip()
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if product exists - if yes, don't track
    existing = await db.products.find_one({
        "$or": [
            {"part_number": {"$regex": f"^{code_upper}$", "$options": "i"}},
            {"cross_references.code": {"$regex": f"^{code_upper}$", "$options": "i"}}
        ]
    })
    
    if existing:
        return {"status": "found", "product_id": existing.get("id")}
    
    # Update or insert not found code
    await db.not_found_codes.update_one(
        {"code": code_upper},
        {
            "$set": {"last_searched": now},
            "$inc": {"search_count": 1},
            "$setOnInsert": {"first_searched": now, "code": code_upper}
        },
        upsert=True
    )
    
    return {"status": "tracked"}

@api_router.get("/products/{product_id}/related")
async def get_related_products(product_id: str, limit: int = 6):
    """Get products with common applications"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    applications = product.get("applications", [])
    if not applications:
        # If no applications, return same product line
        related = await db.products.find(
            {"product_line": product["product_line"], "id": {"$ne": product_id}},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        return related
    
    # Find products with overlapping applications
    make_vehicles = [(app["make"], app["vehicle"]) for app in applications]
    
    or_conditions = []
    for make, vehicle in make_vehicles:
        or_conditions.append({
            "applications": {
                "$elemMatch": {
                    "make": {"$regex": make, "$options": "i"},
                    "vehicle": {"$regex": vehicle, "$options": "i"}
                }
            }
        })
    
    related = await db.products.find(
        {"$or": or_conditions, "id": {"$ne": product_id}},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return related


# ========== ADMIN ROUTES ==========

@api_router.post("/admin/login", response_model=TokenResponse)
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"username": data.username})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(data.username)
    return TokenResponse(access_token=token)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/admin/change-password")
async def admin_change_password(data: ChangePasswordRequest, username: str = Depends(verify_token)):
    """Change admin password"""
    admin = await db.admins.find_one({"username": username})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(data.current_password, admin["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    await db.admins.update_one(
        {"username": username},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    return {"message": "Password changed successfully"}

@api_router.post("/admin/products", response_model=Product)
async def create_product(product: ProductCreate, username: str = Depends(verify_token)):
    product_dict = product.model_dump()
    product_obj = Product(**product_dict)
    
    # Check if part number already exists
    existing = await db.products.find_one({"part_number": product.part_number.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Part number already exists")
    
    doc = product_obj.model_dump()
    doc["part_number"] = doc["part_number"].upper()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.products.insert_one(doc)
    return product_obj

@api_router.put("/admin/products/{product_id}", response_model=Dict)
async def update_product(product_id: str, update: ProductUpdate, username: str = Depends(verify_token)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "part_number" in update_data:
        update_data["part_number"] = update_data["part_number"].upper()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_token)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.post("/admin/products/bulk")
async def bulk_import_products(file: UploadFile = File(...), username: str = Depends(verify_token)):
    """Import products from JSON or CSV file"""
    content = await file.read()
    
    products_to_import = []
    errors = []
    
    try:
        if file.filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            products_to_import = data if isinstance(data, list) else [data]
        elif file.filename.endswith('.csv'):
            csv_content = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_content))
            for row in reader:
                # Parse nested fields
                product = {
                    "part_number": row.get("part_number", ""),
                    "product_line": row.get("product_line", ""),
                    "description": row.get("description", ""),
                    "status": row.get("status", "developed"),
                    "applications": [],
                    "cross_references": [],
                    "measurements": {},
                    "image_url": row.get("image_url"),
                    "drawing_url": row.get("drawing_url"),
                    "notes": row.get("notes")
                }
                
                # Parse measurements based on product line
                if row.get("outer_diameter"):
                    product["measurements"]["outer_diameter"] = float(row["outer_diameter"])
                if row.get("height"):
                    product["measurements"]["height"] = float(row["height"])
                if row.get("thickness"):
                    product["measurements"]["thickness"] = float(row["thickness"])
                if row.get("center_hole"):
                    product["measurements"]["center_hole"] = float(row["center_hole"])
                if row.get("quantity_holes"):
                    product["measurements"]["quantity_holes"] = int(row["quantity_holes"])
                if row.get("width"):
                    product["measurements"]["width"] = float(row["width"])
                
                # Parse applications (semicolon-separated: make|vehicle|model|start_year|end_year|vehicle_type)
                if row.get("applications"):
                    apps = row["applications"].split(";")
                    for app in apps:
                        parts = app.split("|")
                        if len(parts) >= 4:
                            product["applications"].append({
                                "make": parts[0],
                                "vehicle": parts[1],
                                "model": parts[2] if len(parts) > 2 else "",
                                "start_year": int(parts[3]) if len(parts) > 3 and parts[3].strip() else 0,
                                "end_year": int(parts[4]) if len(parts) > 4 and parts[4].strip() else None,
                                "vehicle_type": parts[5] if len(parts) > 5 else ""
                            })
                
                # Parse cross references (comma-separated: manufacturer|code)
                if row.get("cross_references"):
                    refs = row["cross_references"].split(";")
                    for ref in refs:
                        parts = ref.split("|")
                        if len(parts) >= 2:
                            product["cross_references"].append({
                                "manufacturer": parts[0],
                                "code": parts[1]
                            })
                
                products_to_import.append(product)
        else:
            raise HTTPException(status_code=400, detail="File must be JSON or CSV")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    imported_count = 0
    for product_data in products_to_import:
        try:
            product = ProductCreate(**product_data)
            product_obj = Product(**product.model_dump())
            
            doc = product_obj.model_dump()
            doc["part_number"] = doc["part_number"].upper()
            doc["created_at"] = doc["created_at"].isoformat()
            doc["updated_at"] = doc["updated_at"].isoformat()
            
            # Upsert based on part number
            await db.products.update_one(
                {"part_number": doc["part_number"]},
                {"$set": doc},
                upsert=True
            )
            imported_count += 1
        except Exception as e:
            errors.append({"part_number": product_data.get("part_number"), "error": str(e)})
    
    return {
        "imported": imported_count,
        "errors": errors,
        "total": len(products_to_import)
    }

# ========== SEPARATE BULK IMPORTS ==========

@api_router.post("/admin/bulk/applications")
async def bulk_import_applications(file: UploadFile = File(...), username: str = Depends(verify_token)):
    """Import applications from CSV: part_number, make, vehicle, model, start_year, end_year, vehicle_type"""
    content = await file.read()
    
    imported_count = 0
    errors = []
    
    try:
        csv_content = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            part_number = row.get("part_number", "").upper().strip()
            if not part_number:
                continue
            
            application = {
                "make": row.get("make", "").strip(),
                "vehicle": row.get("vehicle", "").strip(),
                "model": row.get("model", "").strip(),
                "start_year": int(row.get("start_year", 0)) if row.get("start_year", "").strip() else 0,
                "end_year": int(row.get("end_year")) if row.get("end_year", "").strip() else None,
                "vehicle_type": row.get("vehicle_type", "").strip()
            }
            
            if not application["make"] or not application["vehicle"]:
                errors.append({"part_number": part_number, "error": "Missing make or vehicle"})
                continue
            
            # Add application to product
            result = await db.products.update_one(
                {"part_number": part_number},
                {"$addToSet": {"applications": application}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                imported_count += 1
            else:
                errors.append({"part_number": part_number, "error": "Product not found"})
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    return {"imported": imported_count, "errors": errors}

@api_router.post("/admin/bulk/cross-references")
async def bulk_import_cross_references(file: UploadFile = File(...), username: str = Depends(verify_token)):
    """Import cross references from CSV: part_number, manufacturer, code"""
    content = await file.read()
    
    imported_count = 0
    errors = []
    
    try:
        csv_content = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            part_number = row.get("part_number", "").upper().strip()
            if not part_number:
                continue
            
            cross_ref = {
                "manufacturer": row.get("manufacturer", "").strip(),
                "code": row.get("code", "").upper().strip()
            }
            
            if not cross_ref["manufacturer"] or not cross_ref["code"]:
                errors.append({"part_number": part_number, "error": "Missing manufacturer or code"})
                continue
            
            # Add cross reference to product
            result = await db.products.update_one(
                {"part_number": part_number},
                {"$addToSet": {"cross_references": cross_ref}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                imported_count += 1
            else:
                errors.append({"part_number": part_number, "error": "Product not found"})
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    return {"imported": imported_count, "errors": errors}

@api_router.post("/admin/bulk/measurements")
async def bulk_import_measurements(file: UploadFile = File(...), username: str = Depends(verify_token)):
    """Import measurements from CSV: part_number + measurement columns"""
    content = await file.read()
    
    imported_count = 0
    errors = []
    
    # Measurement fields by product line
    disc_fields = ["outer_diameter", "thickness", "minimum_thickness", "height", "center_hole", 
                   "quantity_holes", "pcd", "disc_type", "drilled", "slotted", "fitting_position", 
                   "disc_drum", "paired_part_number"]
    pad_fields = ["width", "height", "thickness", "acoustic_wear_warning", 
                  "electronic_wear_sensor", "extra_components_included"]
    drum_fields = ["outer_diameter", "inner_diameter", "maximum_diameter", "height", 
                   "offset", "inner_hole", "quantity_holes", "fitting_position"]
    shoe_fields = ["thickness", "drum_diameter", "width"]
    caliper_fields = ["piston_size", "fitting_position", "electronic_brake_caliper", "paired_part_number"]
    
    all_fields = set(disc_fields + pad_fields + drum_fields + shoe_fields + caliper_fields)
    
    try:
        csv_content = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            part_number = row.get("part_number", "").upper().strip()
            if not part_number:
                continue
            
            measurements = {}
            for field in all_fields:
                value = row.get(field, "").strip()
                if value:
                    # Convert to appropriate type
                    if field in ["drilled", "slotted", "disc_drum", "acoustic_wear_warning", 
                                "electronic_wear_sensor", "extra_components_included", "electronic_brake_caliper"]:
                        measurements[field] = value.lower() in ["yes", "true", "1", "sim"]
                    elif field in ["quantity_holes"]:
                        measurements[field] = int(value)
                    elif field in ["disc_type", "fitting_position", "paired_part_number"]:
                        measurements[field] = value
                    else:
                        try:
                            measurements[field] = float(value)
                        except ValueError:
                            measurements[field] = value
            
            if not measurements:
                continue
            
            # Update product measurements
            result = await db.products.update_one(
                {"part_number": part_number},
                {"$set": {"measurements": measurements, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                imported_count += 1
            else:
                errors.append({"part_number": part_number, "error": "Product not found"})
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    return {"imported": imported_count, "errors": errors}

@api_router.post("/admin/bulk/logistics")
async def bulk_import_logistics(file: UploadFile = File(...), username: str = Depends(verify_token)):
    """Import logistics from CSV: part_number, weight_kg, gross_weight_kg, ean_code, ncm, vpe, etc."""
    content = await file.read()
    
    imported_count = 0
    errors = []
    
    logistics_fields = ["weight_kg", "gross_weight_kg", "packaging_width", "packaging_height", 
                       "packaging_depth", "ean_code", "ncm", "vpe", "country_of_origin"]
    
    try:
        csv_content = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            part_number = row.get("part_number", "").upper().strip()
            if not part_number:
                continue
            
            logistics = {}
            for field in logistics_fields:
                value = row.get(field, "").strip()
                if value:
                    if field in ["weight_kg", "gross_weight_kg", "packaging_width", "packaging_height", "packaging_depth"]:
                        logistics[field] = float(value)
                    elif field == "vpe":
                        logistics[field] = int(value)
                    else:
                        logistics[field] = value
            
            if not logistics:
                continue
            
            # Update product logistics
            result = await db.products.update_one(
                {"part_number": part_number},
                {"$set": {"logistics": logistics, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                imported_count += 1
            else:
                errors.append({"part_number": part_number, "error": "Product not found"})
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    return {"imported": imported_count, "errors": errors}

# ========== PRODUCT SPECIFIC DATA ENDPOINTS ==========

@api_router.put("/admin/products/{product_id}/applications")
async def update_product_applications(product_id: str, applications: List[Application], username: str = Depends(verify_token)):
    """Replace all applications for a product"""
    apps_list = [app.model_dump() for app in applications]
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"applications": apps_list, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Applications updated", "count": len(apps_list)}

@api_router.post("/admin/products/{product_id}/applications")
async def add_product_application(product_id: str, application: Application, username: str = Depends(verify_token)):
    """Add a single application to a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$addToSet": {"applications": application.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Application added"}

@api_router.delete("/admin/products/{product_id}/applications")
async def remove_product_application(product_id: str, make: str, vehicle: str, model: str = "", start_year: int = 0, username: str = Depends(verify_token)):
    """Remove a specific application from a product"""
    pull_query = {"make": make, "vehicle": vehicle}
    if model:
        pull_query["model"] = model
    if start_year:
        pull_query["start_year"] = start_year
    result = await db.products.update_one(
        {"id": product_id},
        {"$pull": {"applications": pull_query},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Application removed"}

@api_router.put("/admin/products/{product_id}/cross-references")
async def update_product_cross_references(product_id: str, cross_references: List[CrossReference], username: str = Depends(verify_token)):
    """Replace all cross references for a product"""
    refs_list = [ref.model_dump() for ref in cross_references]
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"cross_references": refs_list, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Cross references updated", "count": len(refs_list)}

@api_router.post("/admin/products/{product_id}/cross-references")
async def add_product_cross_reference(product_id: str, cross_ref: CrossReference, username: str = Depends(verify_token)):
    """Add a single cross reference to a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$addToSet": {"cross_references": cross_ref.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Cross reference added"}

@api_router.delete("/admin/products/{product_id}/cross-references")
async def remove_product_cross_reference(product_id: str, manufacturer: str, code: str, username: str = Depends(verify_token)):
    """Remove a specific cross reference from a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$pull": {"cross_references": {"manufacturer": manufacturer, "code": code}},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Cross reference removed"}

@api_router.put("/admin/products/{product_id}/measurements")
async def update_product_measurements(product_id: str, measurements: Dict[str, Any], username: str = Depends(verify_token)):
    """Update measurements for a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"measurements": measurements, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Measurements updated"}

@api_router.put("/admin/products/{product_id}/logistics")
async def update_product_logistics(product_id: str, logistics: LogisticsInfo, username: str = Depends(verify_token)):
    """Update logistics for a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"logistics": logistics.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Logistics updated"}

@api_router.get("/admin/products", response_model=PaginatedResponse)
async def admin_get_products(
    page: int = 1,
    page_size: int = 50,
    product_line: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    username: str = Depends(verify_token)
):
    query = {}
    if product_line:
        query["product_line"] = product_line
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"part_number": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.products.count_documents(query)
    skip = (page - 1) * page_size
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(page_size).to_list(page_size)
    
    return PaginatedResponse(
        items=products,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1
    )

@api_router.get("/admin/stats")
async def admin_stats(username: str = Depends(verify_token)):
    """Get dashboard statistics"""
    total = await db.products.count_documents({})
    
    pipeline = [
        {"$group": {"_id": "$product_line", "count": {"$sum": 1}}}
    ]
    by_line = await db.products.aggregate(pipeline).to_list(10)
    
    pipeline_status = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    by_status = await db.products.aggregate(pipeline_status).to_list(10)
    
    # Count not found codes
    not_found_count = await db.not_found_codes.count_documents({})
    
    return {
        "total_products": total,
        "by_product_line": {item["_id"]: item["count"] for item in by_line if item["_id"]},
        "by_status": {item["_id"]: item["count"] for item in by_status if item["_id"]},
        "not_found_codes": not_found_count
    }

@api_router.get("/admin/not-found-codes")
async def get_not_found_codes(
    page: int = 1,
    page_size: int = 50,
    sort_by: str = "search_count",
    username: str = Depends(verify_token)
):
    """Get list of codes that customers searched but didn't find"""
    total = await db.not_found_codes.count_documents({})
    skip = (page - 1) * page_size
    
    sort_field = "search_count" if sort_by == "search_count" else "last_searched"
    
    codes = await db.not_found_codes.find({}, {"_id": 0}).sort(sort_field, -1).skip(skip).limit(page_size).to_list(page_size)
    
    return {
        "items": codes,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
    }

@api_router.delete("/admin/not-found-codes/{code}")
async def delete_not_found_code(code: str, username: str = Depends(verify_token)):
    """Delete a not found code (e.g., after adding the product)"""
    result = await db.not_found_codes.delete_one({"code": code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"message": "Code deleted"}

@api_router.delete("/admin/not-found-codes")
async def clear_all_not_found_codes(username: str = Depends(verify_token)):
    """Clear all not found codes"""
    result = await db.not_found_codes.delete_many({})
    return {"deleted": result.deleted_count}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_seed_admin():
    """Create default admin if not exists"""
    existing = await db.admins.find_one({"username": "adminfleu"})
    if not existing:
        admin = {
            "username": "adminfleu",
            "password": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin)
        logger.info("Default admin user created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
