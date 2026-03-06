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
    brand: str
    model: str
    year_from: int
    year_to: int

class CrossReference(BaseModel):
    manufacturer: str
    code: str

class MeasurementsDisc(BaseModel):
    outer_diameter: Optional[float] = None
    height: Optional[float] = None
    thickness: Optional[float] = None
    center_hole: Optional[float] = None
    quantity_holes: Optional[int] = None
    pcd: Optional[float] = None  # Pitch Circle Diameter

class MeasurementsPad(BaseModel):
    width: Optional[float] = None
    height: Optional[float] = None
    thickness: Optional[float] = None

class MeasurementsDrum(BaseModel):
    outer_diameter: Optional[float] = None
    inner_diameter: Optional[float] = None
    height: Optional[float] = None

class MeasurementsShoe(BaseModel):
    width: Optional[float] = None
    radius: Optional[float] = None
    thickness: Optional[float] = None

class MeasurementsCaliper(BaseModel):
    piston_diameter: Optional[float] = None
    position: Optional[str] = None  # front/rear, left/right

class LogisticsInfo(BaseModel):
    weight_kg: Optional[float] = None
    packaging_width: Optional[float] = None
    packaging_height: Optional[float] = None
    packaging_depth: Optional[float] = None
    ean_code: Optional[str] = None
    ncm: Optional[str] = None

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
    query: Optional[str] = None  # for part number, original code, cross reference
    product_line: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
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
    if search.brand or search.model or search.year:
        app_query = {}
        if search.brand:
            app_query["applications.brand"] = {"$regex": search.brand, "$options": "i"}
        if search.model:
            app_query["applications.model"] = {"$regex": search.model, "$options": "i"}
        if search.year:
            app_query["$and"] = [
                {"applications.year_from": {"$lte": search.year}},
                {"applications.year_to": {"$gte": search.year}}
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

@api_router.get("/brands")
async def get_brands():
    """Get all unique vehicle brands"""
    pipeline = [
        {"$unwind": "$applications"},
        {"$group": {"_id": "$applications.brand"}},
        {"$sort": {"_id": 1}}
    ]
    brands = await db.products.aggregate(pipeline).to_list(1000)
    return [b["_id"] for b in brands if b["_id"]]

@api_router.get("/models/{brand}")
async def get_models(brand: str):
    """Get all models for a specific brand"""
    pipeline = [
        {"$unwind": "$applications"},
        {"$match": {"applications.brand": {"$regex": brand, "$options": "i"}}},
        {"$group": {"_id": "$applications.model"}},
        {"$sort": {"_id": 1}}
    ]
    models = await db.products.aggregate(pipeline).to_list(1000)
    return [m["_id"] for m in models if m["_id"]]

@api_router.get("/product-lines")
async def get_product_lines():
    """Get all product lines"""
    return ["disc", "drum", "pad", "shoe", "caliper"]

@api_router.get("/statuses")
async def get_statuses():
    """Get all product statuses"""
    return [
        {"value": "developed", "label": "Desenvolvido"},
        {"value": "not_developed", "label": "Não Desenvolvido"},
        {"value": "in_development", "label": "Em Desenvolvimento"},
        {"value": "new", "label": "Novo no Portfólio"}
    ]

# ========== ADMIN ROUTES ==========

@api_router.post("/admin/login", response_model=TokenResponse)
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"username": data.username})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(data.username)
    return TokenResponse(access_token=token)

@api_router.post("/admin/setup")
async def admin_setup():
    """Create default admin if not exists"""
    existing = await db.admins.find_one({"username": "admin"})
    if existing:
        return {"message": "Admin already exists"}
    
    admin = {
        "username": "admin",
        "password": hash_password("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin)
    return {"message": "Admin created", "username": "admin", "password": "admin123"}

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
                
                # Parse applications (comma-separated: brand|model|year_from|year_to)
                if row.get("applications"):
                    apps = row["applications"].split(";")
                    for app in apps:
                        parts = app.split("|")
                        if len(parts) >= 4:
                            product["applications"].append({
                                "brand": parts[0],
                                "model": parts[1],
                                "year_from": int(parts[2]),
                                "year_to": int(parts[3])
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
    
    return {
        "total_products": total,
        "by_product_line": {item["_id"]: item["count"] for item in by_line if item["_id"]},
        "by_status": {item["_id"]: item["count"] for item in by_status if item["_id"]}
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
