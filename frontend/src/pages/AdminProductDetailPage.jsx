import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, Trash2, Plus, X, Loader2,
  Disc, CircleDot, LayoutGrid, Wrench, Settings2,
  Package, Car, Tag, Ruler, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

const productLineIcons = {
  disc: Disc,
  drum: CircleDot,
  pad: LayoutGrid,
  shoe: Wrench,
  caliper: Settings2,
};

const statusOptions = [
  { value: "developed", label: "Developed" },
  { value: "not_developed", label: "Not Developed" },
  { value: "in_development", label: "In Development" },
  { value: "new", label: "New in Portfolio" },
];

const discTypeOptions = ["Solid", "Internally ventilated", "Externally ventilated"];
const fittingPositionOptions = ["Front", "Rear", "Front Left", "Front Right", "Rear Left", "Rear Right"];

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    part_number: "",
    product_line: "disc",
    description: "",
    status: "developed",
    applications: [],
    cross_references: [],
    measurements: {},
    logistics: {},
    image_url: "",
    drawing_url: "",
    notes: "",
  });
  
  // New application form
  const [newApp, setNewApp] = useState({ make: "", vehicle: "", model: "", start_year: "", end_year: "", vehicle_type: "" });
  // New cross reference form
  const [newRef, setNewRef] = useState({ manufacturer: "", code: "" });

  const token = localStorage.getItem("admin_token");
  const axiosAuth = axios.create({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchProduct = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error("Product not found");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchProduct();
  }, [token, navigate, fetchProduct]);

  const handleChange = (field, value) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (field, value, isBoolean = false) => {
    setProduct(prev => ({
      ...prev,
      measurements: { 
        ...prev.measurements, 
        [field]: isBoolean ? value : (value === "" ? null : (isNaN(parseFloat(value)) ? value : parseFloat(value)))
      }
    }));
  };

  const handleLogisticsChange = (field, value) => {
    setProduct(prev => ({
      ...prev,
      logistics: { 
        ...prev.logistics, 
        [field]: value === "" ? null : (isNaN(parseFloat(value)) ? value : parseFloat(value))
      }
    }));
  };

  // Applications
  const addApplication = () => {
    if (newApp.make && newApp.vehicle && newApp.start_year) {
      setProduct(prev => ({
        ...prev,
        applications: [...prev.applications, {
          make: newApp.make,
          vehicle: newApp.vehicle,
          model: newApp.model || "",
          start_year: parseInt(newApp.start_year),
          end_year: newApp.end_year ? parseInt(newApp.end_year) : null,
          vehicle_type: newApp.vehicle_type || ""
        }]
      }));
      setNewApp({ make: "", vehicle: "", model: "", start_year: "", end_year: "", vehicle_type: "" });
    } else {
      toast.error("Make, Vehicle and Start Year are required");
    }
  };

  const removeApplication = (index) => {
    setProduct(prev => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index)
    }));
  };

  // Cross References
  const addCrossRef = () => {
    if (newRef.manufacturer && newRef.code) {
      setProduct(prev => ({
        ...prev,
        cross_references: [...prev.cross_references, {
          manufacturer: newRef.manufacturer,
          code: newRef.code.toUpperCase()
        }]
      }));
      setNewRef({ manufacturer: "", code: "" });
    } else {
      toast.error("Fill all cross reference fields");
    }
  };

  const removeCrossRef = (index) => {
    setProduct(prev => ({
      ...prev,
      cross_references: prev.cross_references.filter((_, i) => i !== index)
    }));
  };

  // Save product
  const handleSave = async () => {
    if (!product.part_number || !product.description) {
      toast.error("Part Number and Description are required");
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await axiosAuth.post(`${API}/admin/products`, product);
        toast.success("Product created!");
      } else {
        await axiosAuth.put(`${API}/admin/products/${id}`, product);
        toast.success("Product updated!");
      }
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error saving product");
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axiosAuth.delete(`${API}/admin/products/${id}`);
      toast.success("Product deleted!");
      navigate("/admin");
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  const Icon = productLineIcons[product.product_line] || Disc;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="logo-container">
              <img src={LOGO_URL} alt="FREMAX" className="h-8" />
            </Link>
            <span className="font-heading text-lg text-white uppercase">
              {isNew ? "New Product" : product.part_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button variant="ghost" className="text-red-500 hover:text-red-400" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button 
              className="bg-[#FFB800] text-black hover:bg-[#F59E0B]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Product Info */}
          <div className="col-span-3">
            <div className="bg-[#121212] border border-[#27272A] p-6 sticky top-24">
              <div className="aspect-square bg-[#050505] flex items-center justify-center mb-4">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.part_number} className="max-w-full max-h-full object-contain" />
                ) : (
                  <Icon className="w-20 h-20 text-[#27272A]" />
                )}
              </div>
              <h2 className="font-heading text-2xl text-white uppercase mb-2">{product.part_number || "NEW"}</h2>
              <Badge className="mb-4">{product.product_line?.toUpperCase()}</Badge>
              <p className="text-neutral-400 text-sm">{product.description || "No description"}</p>
            </div>
          </div>

          {/* Main Content - Tabs */}
          <div className="col-span-9">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full grid grid-cols-5 bg-[#121212] border border-[#27272A] mb-6">
                <TabsTrigger value="general" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
                  <Info className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="specs" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
                  <Ruler className="w-4 h-4 mr-2" />
                  Specs
                </TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
                  <Car className="w-4 h-4 mr-2" />
                  Applications
                </TabsTrigger>
                <TabsTrigger value="cross" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
                  <Tag className="w-4 h-4 mr-2" />
                  Cross Ref.
                </TabsTrigger>
                <TabsTrigger value="logistics" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
                  <Package className="w-4 h-4 mr-2" />
                  Logistics
                </TabsTrigger>
              </TabsList>

              {/* GENERAL TAB */}
              <TabsContent value="general">
                <div className="bg-[#121212] border border-[#27272A] p-6 space-y-6">
                  <h3 className="font-heading text-xl text-white uppercase">General Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">PART NUMBER *</Label>
                      <Input
                        value={product.part_number}
                        onChange={(e) => handleChange("part_number", e.target.value.toUpperCase())}
                        className="bg-[#09090B] border-[#27272A] font-mono"
                        placeholder="Ex: BD-1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">PRODUCT LINE *</Label>
                      <Select value={product.product_line} onValueChange={(v) => handleChange("product_line", v)}>
                        <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-[#27272A]">
                          <SelectItem value="disc">Brake Disc</SelectItem>
                          <SelectItem value="drum">Brake Drum</SelectItem>
                          <SelectItem value="pad">Brake Pad</SelectItem>
                          <SelectItem value="shoe">Brake Shoe</SelectItem>
                          <SelectItem value="caliper">Brake Caliper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-400 font-mono text-xs">DESCRIPTION *</Label>
                    <Textarea
                      value={product.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="bg-[#09090B] border-[#27272A] min-h-[100px]"
                      placeholder="Product description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">STATUS</Label>
                      <Select value={product.status} onValueChange={(v) => handleChange("status", v)}>
                        <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-[#27272A]">
                          {statusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">IMAGE URL</Label>
                      <Input
                        value={product.image_url || ""}
                        onChange={(e) => handleChange("image_url", e.target.value)}
                        className="bg-[#09090B] border-[#27272A]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">DRAWING URL</Label>
                      <Input
                        value={product.drawing_url || ""}
                        onChange={(e) => handleChange("drawing_url", e.target.value)}
                        className="bg-[#09090B] border-[#27272A]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-400 font-mono text-xs">NOTES</Label>
                    <Textarea
                      value={product.notes || ""}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="bg-[#09090B] border-[#27272A] min-h-[80px]"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </TabsContent>

              {/* SPECIFICATIONS TAB */}
              <TabsContent value="specs">
                <div className="bg-[#121212] border border-[#27272A] p-6 space-y-6">
                  <h3 className="font-heading text-xl text-white uppercase">Technical Specifications</h3>
                  
                  {/* DISC MEASUREMENTS */}
                  {product.product_line === "disc" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">OUTER DIAMETER (mm)</Label>
                          <Input type="number" value={product.measurements?.outer_diameter || ""} onChange={(e) => handleMeasurementChange("outer_diameter", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">THICKNESS (mm)</Label>
                          <Input type="number" value={product.measurements?.thickness || ""} onChange={(e) => handleMeasurementChange("thickness", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">MIN. THICKNESS (mm)</Label>
                          <Input type="number" value={product.measurements?.minimum_thickness || ""} onChange={(e) => handleMeasurementChange("minimum_thickness", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">HEIGHT (mm)</Label>
                          <Input type="number" value={product.measurements?.height || ""} onChange={(e) => handleMeasurementChange("height", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">CENTER HOLE (mm)</Label>
                          <Input type="number" value={product.measurements?.center_hole || ""} onChange={(e) => handleMeasurementChange("center_hole", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">QTY. HOLES</Label>
                          <Input type="number" value={product.measurements?.quantity_holes || ""} onChange={(e) => handleMeasurementChange("quantity_holes", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">PCD (mm)</Label>
                          <Input type="number" value={product.measurements?.pcd || ""} onChange={(e) => handleMeasurementChange("pcd", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">DISC TYPE</Label>
                          <Select value={product.measurements?.disc_type || ""} onValueChange={(v) => handleMeasurementChange("disc_type", v)}>
                            <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-[#27272A]">
                              {discTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">FITTING POSITION</Label>
                          <Select value={product.measurements?.fitting_position || ""} onValueChange={(v) => handleMeasurementChange("fitting_position", v)}>
                            <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-[#27272A]">
                              {fittingPositionOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                          <Switch checked={product.measurements?.drilled || false} onCheckedChange={(v) => handleMeasurementChange("drilled", v, true)} />
                          <Label className="text-neutral-400 font-mono text-xs">DRILLED</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={product.measurements?.slotted || false} onCheckedChange={(v) => handleMeasurementChange("slotted", v, true)} />
                          <Label className="text-neutral-400 font-mono text-xs">SLOTTED</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={product.measurements?.disc_drum || false} onCheckedChange={(v) => handleMeasurementChange("disc_drum", v, true)} />
                          <Label className="text-neutral-400 font-mono text-xs">DISC/DRUM</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">PAIRED PART NUMBER</Label>
                        <Input value={product.measurements?.paired_part_number || ""} onChange={(e) => handleMeasurementChange("paired_part_number", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono w-1/3" />
                      </div>
                    </div>
                  )}

                  {/* DRUM MEASUREMENTS */}
                  {product.product_line === "drum" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">OUTER DIAMETER (mm)</Label>
                        <Input type="number" value={product.measurements?.outer_diameter || ""} onChange={(e) => handleMeasurementChange("outer_diameter", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">INNER DIAMETER (mm)</Label>
                        <Input type="number" value={product.measurements?.inner_diameter || ""} onChange={(e) => handleMeasurementChange("inner_diameter", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">MAX. DIAMETER (mm)</Label>
                        <Input type="number" value={product.measurements?.maximum_diameter || ""} onChange={(e) => handleMeasurementChange("maximum_diameter", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">HEIGHT (mm)</Label>
                        <Input type="number" value={product.measurements?.height || ""} onChange={(e) => handleMeasurementChange("height", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">OFFSET (mm)</Label>
                        <Input type="number" value={product.measurements?.offset || ""} onChange={(e) => handleMeasurementChange("offset", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">INNER HOLE (mm)</Label>
                        <Input type="number" value={product.measurements?.inner_hole || ""} onChange={(e) => handleMeasurementChange("inner_hole", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">QTY. HOLES</Label>
                        <Input type="number" value={product.measurements?.quantity_holes || ""} onChange={(e) => handleMeasurementChange("quantity_holes", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">FITTING POSITION</Label>
                        <Select value={product.measurements?.fitting_position || ""} onValueChange={(v) => handleMeasurementChange("fitting_position", v)}>
                          <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121212] border-[#27272A]">
                            {fittingPositionOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* PAD MEASUREMENTS */}
                  {product.product_line === "pad" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">WIDTH (mm)</Label>
                          <Input type="number" value={product.measurements?.width || ""} onChange={(e) => handleMeasurementChange("width", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">HEIGHT (mm)</Label>
                          <Input type="number" value={product.measurements?.height || ""} onChange={(e) => handleMeasurementChange("height", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">THICKNESS (mm)</Label>
                          <Input type="number" value={product.measurements?.thickness || ""} onChange={(e) => handleMeasurementChange("thickness", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <Switch checked={product.measurements?.acoustic_wear_warning || false} onCheckedChange={(v) => handleMeasurementChange("acoustic_wear_warning", v, true)} />
                          <Label className="text-neutral-400 font-mono text-xs">ACOUSTIC WEAR WARNING</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={product.measurements?.electronic_wear_sensor || false} onCheckedChange={(v) => handleMeasurementChange("electronic_wear_sensor", v, true)} />
                          <Label className="text-neutral-400 font-mono text-xs">ELECTRONIC WEAR SENSOR</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={product.measurements?.extra_components_included || false} onCheckedChange={(v) => handleMeasurementChange("extra_components_included", v, true)} />
                          <Label className="text-neutral-400 font-mono text-xs">EXTRA COMPONENTS</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHOE MEASUREMENTS */}
                  {product.product_line === "shoe" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">THICKNESS (mm)</Label>
                        <Input type="number" value={product.measurements?.thickness || ""} onChange={(e) => handleMeasurementChange("thickness", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">DRUM DIAMETER (mm)</Label>
                        <Input type="number" value={product.measurements?.drum_diameter || ""} onChange={(e) => handleMeasurementChange("drum_diameter", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">WIDTH (mm)</Label>
                        <Input type="number" value={product.measurements?.width || ""} onChange={(e) => handleMeasurementChange("width", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                      </div>
                    </div>
                  )}

                  {/* CALIPER MEASUREMENTS */}
                  {product.product_line === "caliper" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">PISTON SIZE (mm)</Label>
                          <Input type="number" value={product.measurements?.piston_size || ""} onChange={(e) => handleMeasurementChange("piston_size", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">FITTING POSITION</Label>
                          <Select value={product.measurements?.fitting_position || ""} onValueChange={(v) => handleMeasurementChange("fitting_position", v)}>
                            <SelectTrigger className="bg-[#09090B] border-[#27272A]">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-[#27272A]">
                              {fittingPositionOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-400 font-mono text-xs">PAIRED PART NUMBER</Label>
                          <Input value={product.measurements?.paired_part_number || ""} onChange={(e) => handleMeasurementChange("paired_part_number", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={product.measurements?.electronic_brake_caliper || false} onCheckedChange={(v) => handleMeasurementChange("electronic_brake_caliper", v, true)} />
                        <Label className="text-neutral-400 font-mono text-xs">ELECTRONIC BRAKE CALIPER</Label>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* APPLICATIONS TAB */}
              <TabsContent value="applications">
                <div className="bg-[#121212] border border-[#27272A] p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl text-white uppercase">Vehicle Applications</h3>
                    <span className="text-neutral-500 font-mono text-sm">{product.applications?.length || 0} applications</span>
                  </div>
                  
                  {/* Add new application */}
                  <div className="p-4 bg-[#09090B] border border-[#27272A] space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Make *" value={newApp.make} onChange={(e) => setNewApp({...newApp, make: e.target.value})} className="bg-[#121212] border-[#27272A]" />
                      <Input placeholder="Vehicle *" value={newApp.vehicle} onChange={(e) => setNewApp({...newApp, vehicle: e.target.value})} className="bg-[#121212] border-[#27272A]" />
                      <Input placeholder="Model" value={newApp.model} onChange={(e) => setNewApp({...newApp, model: e.target.value})} className="bg-[#121212] border-[#27272A]" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input placeholder="Start Year *" type="number" value={newApp.start_year} onChange={(e) => setNewApp({...newApp, start_year: e.target.value})} className="bg-[#121212] border-[#27272A] font-mono" />
                      <Input placeholder="End Year (blank=ongoing)" type="number" value={newApp.end_year} onChange={(e) => setNewApp({...newApp, end_year: e.target.value})} className="bg-[#121212] border-[#27272A] font-mono" />
                      <Input placeholder="Vehicle Type" value={newApp.vehicle_type} onChange={(e) => setNewApp({...newApp, vehicle_type: e.target.value})} className="bg-[#121212] border-[#27272A]" />
                      <Button onClick={addApplication} className="bg-[#FFB800] text-black hover:bg-[#F59E0B]">
                        <Plus className="w-4 h-4 mr-2" />Add
                      </Button>
                    </div>
                  </div>

                  {/* Applications list */}
                  {product.applications && product.applications.length > 0 ? (
                    <div className="space-y-2">
                      {product.applications.map((app, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#09090B] border border-[#27272A]">
                          <div className="flex items-center gap-4 flex-wrap">
                            <Car className="w-4 h-4 text-[#FFB800] shrink-0" />
                            <span className="font-mono text-white">{app.make}</span>
                            <span className="text-[#FFB800]">{app.vehicle}</span>
                            {app.model && <span className="text-neutral-400">{app.model}</span>}
                            <span className="text-neutral-500 font-mono text-sm">
                              {app.start_year || app.year_from}{app.end_year || app.year_to ? ` - ${app.end_year || app.year_to}` : " \u2192"}
                            </span>
                            {(app.vehicle_type) && <Badge variant="outline" className="text-xs border-[#27272A]">{app.vehicle_type}</Badge>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeApplication(index)}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">No applications added yet</p>
                  )}
                </div>
              </TabsContent>

              {/* CROSS REFERENCES TAB */}
              <TabsContent value="cross">
                <div className="bg-[#121212] border border-[#27272A] p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl text-white uppercase">Cross References</h3>
                    <span className="text-neutral-500 font-mono text-sm">{product.cross_references?.length || 0} references</span>
                  </div>
                  
                  {/* Add new cross reference */}
                  <div className="grid grid-cols-3 gap-2 p-4 bg-[#09090B] border border-[#27272A]">
                    <Input placeholder="Manufacturer" value={newRef.manufacturer} onChange={(e) => setNewRef({...newRef, manufacturer: e.target.value})} className="bg-[#121212] border-[#27272A]" />
                    <Input placeholder="Code" value={newRef.code} onChange={(e) => setNewRef({...newRef, code: e.target.value.toUpperCase()})} className="bg-[#121212] border-[#27272A] font-mono" />
                    <Button onClick={addCrossRef} className="bg-[#FFB800] text-black hover:bg-[#F59E0B]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Cross references list */}
                  {product.cross_references && product.cross_references.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {product.cross_references.map((ref, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#09090B] border border-[#27272A]">
                          <div className="flex items-center gap-4">
                            <Tag className="w-4 h-4 text-[#FFB800]" />
                            <span className="text-neutral-400">{ref.manufacturer}:</span>
                            <span className="font-mono text-white">{ref.code}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeCrossRef(index)}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">No cross references added yet</p>
                  )}
                </div>
              </TabsContent>

              {/* LOGISTICS TAB */}
              <TabsContent value="logistics">
                <div className="bg-[#121212] border border-[#27272A] p-6 space-y-6">
                  <h3 className="font-heading text-xl text-white uppercase">Logistics Information</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">NET WEIGHT (kg)</Label>
                      <Input type="number" step="0.01" value={product.logistics?.weight_kg || ""} onChange={(e) => handleLogisticsChange("weight_kg", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">GROSS WEIGHT (kg)</Label>
                      <Input type="number" step="0.01" value={product.logistics?.gross_weight_kg || ""} onChange={(e) => handleLogisticsChange("gross_weight_kg", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">VPE (QTY/PACKAGE)</Label>
                      <Input type="number" value={product.logistics?.vpe || ""} onChange={(e) => handleLogisticsChange("vpe", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">PACKAGING WIDTH (mm)</Label>
                      <Input type="number" value={product.logistics?.packaging_width || ""} onChange={(e) => handleLogisticsChange("packaging_width", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">PACKAGING HEIGHT (mm)</Label>
                      <Input type="number" value={product.logistics?.packaging_height || ""} onChange={(e) => handleLogisticsChange("packaging_height", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">PACKAGING DEPTH (mm)</Label>
                      <Input type="number" value={product.logistics?.packaging_depth || ""} onChange={(e) => handleLogisticsChange("packaging_depth", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">EAN CODE (BARCODE)</Label>
                      <Input value={product.logistics?.ean_code || ""} onChange={(e) => handleLogisticsChange("ean_code", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" placeholder="7891234567890" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">NCM</Label>
                      <Input value={product.logistics?.ncm || ""} onChange={(e) => handleLogisticsChange("ncm", e.target.value)} className="bg-[#09090B] border-[#27272A] font-mono" placeholder="8708.30.19" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">COUNTRY OF ORIGIN</Label>
                      <Input value={product.logistics?.country_of_origin || ""} onChange={(e) => handleLogisticsChange("country_of_origin", e.target.value)} className="bg-[#09090B] border-[#27272A]" placeholder="Brazil" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
