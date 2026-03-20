import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, X, Disc, CircleDot, LayoutGrid, Wrench, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

const productLineIcons = {
  disc: Disc,
  drum: CircleDot,
  pad: LayoutGrid,
  shoe: Wrench,
  caliper: Settings2,
};

const productLineLabels = {
  disc: "Disc",
  drum: "Drum",
  pad: "Pad",
  shoe: "Shoe",
  caliper: "Caliper",
};

const statusLabels = {
  developed: "Developed",
  not_developed: "Not Developed",
  in_development: "In Development",
  new: "New",
};

const statusClasses = {
  developed: "status-developed",
  not_developed: "status-not-developed",
  in_development: "status-in-development",
  new: "status-new",
};

function ProductCard({ product }) {
  const Icon = productLineIcons[product.product_line] || Disc;
  
  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card group"
      data-testid={`product-card-${product.part_number}`}
    >
      <div className="product-card-image">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.part_number}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <Icon className="w-20 h-20 text-[#27272A] group-hover:text-[#FFB800]/50 transition-colors" />
        )}
        <Badge className={`absolute top-3 right-3 ${statusClasses[product.status]} status-badge`}>
          {statusLabels[product.status]}
        </Badge>
      </div>
      <div className="product-card-info">
        <p className="font-mono text-xs text-neutral-500 uppercase">
          {productLineLabels[product.product_line]}
        </p>
        <h3 className="font-heading text-xl text-white uppercase tracking-tight group-hover:text-[#FFB800] transition-colors">
          {product.part_number}
        </h3>
        <p className="text-sm text-neutral-400 line-clamp-2">
          {product.description}
        </p>
        {product.applications && product.applications.length > 0 && (
          <p className="text-xs text-neutral-500 font-mono mt-2">
            {product.applications[0].make} {product.applications[0].vehicle}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Search filters
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [productLine, setProductLine] = useState(searchParams.get("line") || "");
  const [make, setMake] = useState(searchParams.get("make") || "");
  const [vehicle, setVehicle] = useState(searchParams.get("vehicle") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  
  // Measurements
  const [outerDiameter, setOuterDiameter] = useState(searchParams.get("od") || "");
  const [discThickness, setDiscThickness] = useState(searchParams.get("dt") || "");
  const [centerHole, setCenterHole] = useState(searchParams.get("ch") || "");
  const [quantityHoles, setQuantityHoles] = useState(searchParams.get("qh") || "");
  const [padWidth, setPadWidth] = useState(searchParams.get("pw") || "");
  const [padHeight, setPadHeight] = useState(searchParams.get("ph") || "");
  const [padThickness, setPadThickness] = useState(searchParams.get("pt") || "");

  const searchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const searchBody = {
        query: query || null,
        product_line: productLine && productLine !== "all" ? productLine : null,
        make: make || null,
        vehicle: vehicle || null,
        model: model || null,
        year: year ? parseInt(year) : null,
        outer_diameter_min: outerDiameter ? parseFloat(outerDiameter) - 2 : null,
        outer_diameter_max: outerDiameter ? parseFloat(outerDiameter) + 2 : null,
        disc_thickness_min: discThickness ? parseFloat(discThickness) - 0.5 : null,
        disc_thickness_max: discThickness ? parseFloat(discThickness) + 0.5 : null,
        center_hole: centerHole ? parseFloat(centerHole) : null,
        quantity_holes: quantityHoles ? parseInt(quantityHoles) : null,
        pad_width_min: padWidth ? parseFloat(padWidth) - 2 : null,
        pad_width_max: padWidth ? parseFloat(padWidth) + 2 : null,
        pad_height_min: padHeight ? parseFloat(padHeight) - 2 : null,
        pad_height_max: padHeight ? parseFloat(padHeight) + 2 : null,
        pad_thickness_min: padThickness ? parseFloat(padThickness) - 0.5 : null,
        pad_thickness_max: padThickness ? parseFloat(padThickness) + 0.5 : null,
      };

      const response = await axios.post(`${API}/search?page=${page}&page_size=12`, searchBody);
      setProducts(response.data.items);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
      setCurrentPage(page);
      
      // Track not found codes when searching by code and no results
      if (query && response.data.total === 0) {
        try {
          await axios.post(`${API}/track-not-found?code=${encodeURIComponent(query)}`);
        } catch (err) {
          console.error("Failed to track not found code:", err);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, productLine, make, vehicle, model, year, outerDiameter, discThickness, centerHole, quantityHoles, padWidth, padHeight, padThickness]);

  useEffect(() => {
    searchProducts(1);
  }, [searchProducts]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (productLine) params.set("line", productLine);
    if (make) params.set("make", make);
    if (vehicle) params.set("vehicle", vehicle);
    if (model) params.set("model", model);
    if (year) params.set("year", year);
    if (outerDiameter) params.set("od", outerDiameter);
    if (discThickness) params.set("dt", discThickness);
    if (centerHole) params.set("ch", centerHole);
    if (quantityHoles) params.set("qh", quantityHoles);
    if (padWidth) params.set("pw", padWidth);
    if (padHeight) params.set("ph", padHeight);
    if (padThickness) params.set("pt", padThickness);
    
    setSearchParams(params);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setQuery("");
    setProductLine("");
    setMake("");
    setVehicle("");
    setModel("");
    setYear("");
    setOuterDiameter("");
    setDiscThickness("");
    setCenterHole("");
    setQuantityHoles("");
    setPadWidth("");
    setPadHeight("");
    setPadThickness("");
    setSearchParams(new URLSearchParams());
  };

  const activeFiltersCount = [
    query, productLine, make, vehicle, model, year, 
    outerDiameter, discThickness, centerHole, quantityHoles,
    padWidth, padHeight, padThickness
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link to="/" className="logo-container shrink-0">
            <img src={LOGO_URL} alt="FREMAX" className="h-8 md:h-10" />
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <Input
                type="text"
                placeholder="Search by code or reference..."
                className="w-full h-10 bg-[#121212] border-[#27272A] pl-4 pr-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                data-testid="search-input"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-10 border-[#27272A] bg-[#121212] hover:border-[#FFB800] relative"
                  data-testid="filters-button"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FFB800] text-black text-xs font-mono rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#121212] border-l border-[#27272A] w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-heading text-white uppercase">Advanced Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Product Line */}
                  <div className="space-y-2">
                    <Label className="text-neutral-400 font-mono text-xs">PRODUCT LINE</Label>
                    <Select value={productLine} onValueChange={setProductLine}>
                      <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                        <SelectValue placeholder="All lines" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-[#27272A]">
                        <SelectItem value="all">All lines</SelectItem>
                        <SelectItem value="disc">Discs</SelectItem>
                        <SelectItem value="drum">Drums</SelectItem>
                        <SelectItem value="pad">Pads</SelectItem>
                        <SelectItem value="shoe">Shoes</SelectItem>
                        <SelectItem value="caliper">Calipers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Application Filters */}
                  <div className="space-y-4">
                    <h4 className="font-heading text-white uppercase text-sm">Application</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">MAKE</Label>
                        <Input
                          type="text"
                          placeholder="Ex: Volkswagen"
                          className="bg-[#09090B] border-[#27272A]"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">VEHICLE</Label>
                        <Input
                          type="text"
                          placeholder="Ex: Golf"
                          className="bg-[#09090B] border-[#27272A]"
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">MODEL</Label>
                        <Input
                          type="text"
                          placeholder="Ex: GTI"
                          className="bg-[#09090B] border-[#27272A]"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">YEAR</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 2020"
                          className="bg-[#09090B] border-[#27272A]"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Disc Measurements */}
                  {(productLine === "disc" || !productLine || productLine === "all") && (
                    <div className="space-y-4">
                      <h4 className="font-heading text-white uppercase text-sm">Disc Measurements</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">DIAMETER (mm)</Label>
                          <Input
                            type="number"
                            placeholder="Ex: 280"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={outerDiameter}
                            onChange={(e) => setOuterDiameter(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">THICKNESS (mm)</Label>
                          <Input
                            type="number"
                            placeholder="Ex: 22"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={discThickness}
                            onChange={(e) => setDiscThickness(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">CENTER HOLE (mm)</Label>
                          <Input
                            type="number"
                            placeholder="Ex: 65"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={centerHole}
                            onChange={(e) => setCenterHole(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">QTY. HOLES</Label>
                          <Input
                            type="number"
                            placeholder="Ex: 5"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={quantityHoles}
                            onChange={(e) => setQuantityHoles(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pad Measurements */}
                  {(productLine === "pad" || !productLine || productLine === "all") && (
                    <div className="space-y-4">
                      <h4 className="font-heading text-white uppercase text-sm">Pad Measurements</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">WIDTH (mm)</Label>
                          <Input
                            type="number"
                            placeholder="155"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={padWidth}
                            onChange={(e) => setPadWidth(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">HEIGHT (mm)</Label>
                          <Input
                            type="number"
                            placeholder="60"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={padHeight}
                            onChange={(e) => setPadHeight(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">THICKNESS (mm)</Label>
                          <Input
                            type="number"
                            placeholder="17"
                            className="bg-[#09090B] border-[#27272A] font-mono"
                            value={padThickness}
                            onChange={(e) => setPadThickness(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-[#27272A]"
                      onClick={clearFilters}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button 
                      className="flex-1 bg-[#FFB800] text-black hover:bg-[#F59E0B]"
                      onClick={handleSearch}
                      data-testid="apply-filters-button"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-white uppercase">
              Results
            </h1>
            <p className="text-neutral-500 font-mono text-sm mt-1">
              {total} product{total !== 1 ? "s" : ""} found
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              className="text-neutral-400 hover:text-white"
              onClick={clearFilters}
            >
              <X className="w-4 h-4 mr-2" />
              Clear filters ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Disc className="w-16 h-16 text-[#27272A] mx-auto mb-4" />
            <h2 className="font-heading text-2xl text-white uppercase mb-2">No products found</h2>
            <p className="text-neutral-500 mb-6">Try adjusting filters or search terms</p>
            <Button 
              variant="outline" 
              className="border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800] hover:text-black"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  variant="outline"
                  className="border-[#27272A] bg-[#121212]"
                  disabled={currentPage === 1}
                  onClick={() => searchProducts(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="font-mono text-neutral-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="border-[#27272A] bg-[#121212]"
                  disabled={currentPage === totalPages}
                  onClick={() => searchProducts(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
