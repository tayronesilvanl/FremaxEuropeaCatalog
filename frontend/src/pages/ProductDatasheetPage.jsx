import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2, Disc, CircleDot, LayoutGrid, Wrench, Settings2, Car, Tag, Package, Ruler, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

const productLineIcons = {
  disc: Disc, drum: CircleDot, pad: LayoutGrid, shoe: Wrench, caliper: Settings2,
};
const productLineLabels = {
  disc: "Brake Disc", drum: "Brake Drum", pad: "Brake Pad", shoe: "Brake Shoe", caliper: "Brake Caliper",
};
const statusLabels = {
  developed: "Developed", not_developed: "Not Developed", in_development: "In Development", new: "New in Portfolio",
};
const statusClasses = {
  developed: "status-developed", not_developed: "status-not-developed", in_development: "status-in-development", new: "status-new",
};
const measurementLabels = {
  outer_diameter: "Outer Diameter", inner_diameter: "Inner Diameter", height: "Height", thickness: "Thickness",
  center_hole: "Center Hole", quantity_holes: "Qty. Holes", pcd: "PCD", width: "Width",
  minimum_thickness: "Min. Thickness", maximum_diameter: "Max. Diameter", offset: "Offset",
  inner_hole: "Inner Hole", disc_type: "Disc Type", fitting_position: "Fitting Position",
  drilled: "Drilled", slotted: "Slotted", disc_drum: "Disc/Drum", paired_part_number: "Paired Part Number",
  acoustic_wear_warning: "Acoustic Wear Warning", electronic_wear_sensor: "Electronic Wear Sensor",
  extra_components_included: "Extra Components", piston_size: "Piston Size",
  electronic_brake_caliper: "Electronic Brake Caliper", drum_diameter: "Drum Diameter",
};

function ImageGallery({ product, Icon }) {
  const images = [];
  if (product.image_url) images.push({ url: product.image_url, label: "Product Photo" });
  if (product.drawing_url) images.push({ url: product.drawing_url, label: "Technical Drawing" });

  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-[#121212] border border-[#27272A] aspect-square flex items-center justify-center p-8 sticky top-24">
        <Icon className="w-32 h-32 text-[#27272A]" />
      </div>
    );
  }

  return (
    <div className="sticky top-24 space-y-3">
      <div className="bg-[#121212] border border-[#27272A] aspect-square flex items-center justify-center p-8 relative group">
        <img
          src={images[current].url}
          alt={images[current].label}
          className="max-w-full max-h-full object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="gallery-prev"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="gallery-next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-[#FFB800]" : "bg-white/30 hover:bg-white/50"}`}
                  data-testid={`gallery-dot-${i}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-1 bg-[#121212] border p-2 aspect-video flex items-center justify-center transition-colors ${i === current ? "border-[#FFB800]" : "border-[#27272A] hover:border-[#FFB800]/50"}`}
              data-testid={`gallery-thumb-${i}`}
            >
              <img src={img.url} alt={img.label} className="max-w-full max-h-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-neutral-500 font-mono text-xs">{images[current].label}</p>
    </div>
  );
}

function RelatedProductCard({ product }) {
  const Icon = productLineIcons[product.product_line] || Disc;
  return (
    <Link to={`/product/${product.id}`} className="group bg-[#121212] border border-[#27272A] hover:border-[#FFB800]/50 transition-all p-4" data-testid={`related-product-${product.part_number}`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[#050505] flex items-center justify-center shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.part_number} className="max-w-full max-h-full object-contain" />
          ) : (
            <Icon className="w-8 h-8 text-[#27272A] group-hover:text-[#FFB800]/50 transition-colors" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-neutral-500">{productLineLabels[product.product_line]}</p>
          <p className="font-heading text-lg text-white uppercase truncate group-hover:text-[#FFB800] transition-colors">{product.part_number}</p>
          <p className="text-sm text-neutral-400 truncate">{product.description}</p>
        </div>
      </div>
    </Link>
  );
}

function formatMeasurementValue(key, value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const mmFields = ["outer_diameter","inner_diameter","height","thickness","center_hole","pcd","width","minimum_thickness","maximum_diameter","offset","inner_hole","piston_size","drum_diameter"];
    return mmFields.includes(key) ? `${value} mm` : value;
  }
  return value;
}

export default function ProductDatasheetPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
        try {
          const relatedResponse = await axios.get(`${API}/products/${id}/related?limit=4`);
          setRelatedProducts(relatedResponse.data);
        } catch (err) { console.error("Error fetching related:", err); }
      } catch (err) {
        setError("Product not found");
      } finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" /></div>;

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <Disc className="w-20 h-20 text-[#27272A] mb-4" />
        <h1 className="font-heading text-3xl text-white uppercase mb-4">Product Not Found</h1>
        <Link to="/"><Button className="bg-[#FFB800] text-black hover:bg-[#F59E0B]"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button></Link>
      </div>
    );
  }

  const Icon = productLineIcons[product.product_line] || Disc;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="border-b border-[#27272A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link to="/" className="logo-container shrink-0"><img src={LOGO_URL} alt="FREMAX" className="h-8 md:h-10" /></Link>
          <Separator orientation="vertical" className="h-8 bg-[#27272A]" />
          <Link to="/search" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-mono text-sm">
            <ArrowLeft className="w-4 h-4" />Back to Results
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`${statusClasses[product.status]} status-badge`}>{statusLabels[product.status]}</Badge>
              <span className="text-neutral-500 font-mono text-sm">{productLineLabels[product.product_line]}</span>
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-white uppercase tracking-tight mb-2" data-testid="product-part-number">{product.part_number}</h1>
            <p className="text-lg text-neutral-400" data-testid="product-description">{product.description}</p>
          </div>
          <Button className="bg-[#FFB800] text-black hover:bg-[#F59E0B] font-heading uppercase tracking-wider h-12 px-6" onClick={() => window.open(`/#/datasheet/${product.id}`, '_blank')} data-testid="open-datasheet-button">
            <ExternalLink className="w-4 h-4 mr-2" />Open Datasheet
          </Button>
        </div>

        <div className="datasheet-layout">
          <div className="datasheet-image-area">
            <ImageGallery product={product} Icon={Icon} />
          </div>

          <div className="datasheet-specs-area">
            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-[#121212] border border-[#27272A]">
                <TabsTrigger value="specs" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"><Ruler className="w-4 h-4 mr-2" />SPECS</TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"><Car className="w-4 h-4 mr-2" />APPLICATIONS</TabsTrigger>
                <TabsTrigger value="cross" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"><Tag className="w-4 h-4 mr-2" />CROSS REF.</TabsTrigger>
                <TabsTrigger value="logistics" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"><Package className="w-4 h-4 mr-2" />LOGISTICS</TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">Technical Specifications</h3>
                  {product.measurements && Object.keys(product.measurements).length > 0 ? (
                    <table className="spec-table w-full">
                      <thead><tr><th>Dimension</th><th>Value</th></tr></thead>
                      <tbody>
                        {Object.entries(product.measurements).filter(([,v]) => v !== null && v !== "").map(([key, value]) => (
                          <tr key={key}>
                            <td className="text-neutral-400">{measurementLabels[key] || key}</td>
                            <td className="text-white font-mono">{formatMeasurementValue(key, value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">Measurements not available for this product.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="applications" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">Vehicle Applications</h3>
                  {product.applications && product.applications.length > 0 ? (
                    <table className="spec-table w-full">
                      <thead><tr><th>Make</th><th>Vehicle</th><th>Model</th><th>Years</th><th>Type</th></tr></thead>
                      <tbody>
                        {product.applications.map((app, index) => (
                          <tr key={index}>
                            <td className="text-white font-mono">{app.make}</td>
                            <td className="text-white font-mono">{app.vehicle}</td>
                            <td className="text-neutral-400 font-mono">{app.model || "-"}</td>
                            <td className="text-neutral-400 font-mono">
                              {app.start_year}{app.end_year ? ` - ${app.end_year}` : " \u2192"}
                            </td>
                            <td className="text-neutral-500 font-mono text-sm">{app.vehicle_type || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">No applications registered for this product.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cross" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">Cross References</h3>
                  {product.cross_references && product.cross_references.length > 0 ? (
                    <table className="spec-table w-full">
                      <thead><tr><th>Manufacturer</th><th>Code</th></tr></thead>
                      <tbody>
                        {product.cross_references.map((ref, index) => (
                          <tr key={index}><td className="text-neutral-400">{ref.manufacturer}</td><td className="text-white font-mono">{ref.code}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">No cross references registered for this product.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="logistics" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">Logistics Information</h3>
                  {product.logistics ? (
                    <table className="spec-table w-full">
                      <tbody>
                        {product.logistics.weight_kg && <tr><td className="text-neutral-400">Weight</td><td className="text-white font-mono">{product.logistics.weight_kg} kg</td></tr>}
                        {product.logistics.gross_weight_kg && <tr><td className="text-neutral-400">Gross Weight</td><td className="text-white font-mono">{product.logistics.gross_weight_kg} kg</td></tr>}
                        {product.logistics.vpe && <tr><td className="text-neutral-400">VPE (Qty/Package)</td><td className="text-white font-mono">{product.logistics.vpe}</td></tr>}
                        {product.logistics.packaging_width && <tr><td className="text-neutral-400">Packaging (WxHxD)</td><td className="text-white font-mono">{product.logistics.packaging_width} x {product.logistics.packaging_height} x {product.logistics.packaging_depth} mm</td></tr>}
                        {product.logistics.ean_code && <tr><td className="text-neutral-400">EAN Code</td><td className="text-white font-mono">{product.logistics.ean_code}</td></tr>}
                        {product.logistics.ncm && <tr><td className="text-neutral-400">NCM</td><td className="text-white font-mono">{product.logistics.ncm}</td></tr>}
                        {product.logistics.country_of_origin && <tr><td className="text-neutral-400">Country of Origin</td><td className="text-white font-mono">{product.logistics.country_of_origin}</td></tr>}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">Logistics information not available.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {product.notes && (
              <div className="mt-6 bg-[#121212] border border-[#27272A] p-6">
                <h3 className="font-heading text-xl text-white uppercase mb-4">Notes</h3>
                <p className="text-neutral-400 whitespace-pre-wrap">{product.notes}</p>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-12 pt-12 border-t border-[#27272A]">
            <h2 className="font-heading text-2xl text-white uppercase mb-6">Related Products</h2>
            <p className="text-neutral-500 font-mono text-sm mb-6">Products with common vehicle applications</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="related-products-grid">
              {relatedProducts.map((rp) => <RelatedProductCard key={rp.id} product={rp} />)}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[#27272A] py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={LOGO_URL} alt="FREMAX" className="h-8" />
          <p className="text-neutral-500 text-sm font-mono">&copy; {new Date().getFullYear()} FREMAX - The Maximum in Motion</p>
        </div>
      </footer>
    </div>
  );
}
