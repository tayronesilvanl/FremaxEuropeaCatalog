import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileSpreadsheet, Car, Tag, Ruler, Package, Loader2, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

function ImportCard({ title, description, icon: Icon, endpoint, templateColumns, templateExample }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const token = localStorage.getItem("admin_token");

  const handleImport = async () => {
    if (!file) {
      toast.error("Select a file first");
      return;
    }

    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}${endpoint}`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });
      setResult(response.data);
      toast.success(`${response.data.imported} records imported!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Import error");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = templateColumns + "\n" + templateExample;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${endpoint.replace("/admin/bulk/", "")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-[#121212] border-[#27272A]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFB800]/10 rounded">
            <Icon className="w-6 h-6 text-[#FFB800]" />
          </div>
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            <CardDescription className="text-neutral-500">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => { setFile(e.target.files[0]); setResult(null); }}
            className="bg-[#09090B] border-[#27272A] flex-1"
          />
          <Button variant="outline" className="border-[#27272A]" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
        </div>
        
        <Button 
          className="w-full bg-[#FFB800] text-black hover:bg-[#F59E0B]"
          onClick={handleImport}
          disabled={loading || !file}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Import
        </Button>

        {result && (
          <div className={`p-4 rounded border ${result.errors?.length > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.errors?.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="font-mono text-white">{result.imported} imported</span>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-yellow-500 text-sm font-mono">{result.errors.length} errors:</p>
                <div className="max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-neutral-400 font-mono">
                      {err.part_number}: {err.error}
                    </p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-neutral-500">...and {result.errors.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-neutral-500 font-mono">
          <p className="mb-1">CSV Columns:</p>
          <code className="bg-[#09090B] p-2 block rounded overflow-x-auto whitespace-nowrap">
            {templateColumns}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBulkImportPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  if (!token) {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/admin" className="text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/" className="logo-container">
            <img src={LOGO_URL} alt="FREMAX" className="h-8" />
          </Link>
          <span className="font-heading text-lg text-white uppercase">Bulk Import</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-white uppercase mb-2">Bulk Data Import</h1>
          <p className="text-neutral-500">Import data from CSV files. Make sure products exist before importing related data.</p>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full grid grid-cols-5 bg-[#121212] border border-[#27272A] mb-8">
            <TabsTrigger value="products" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <Car className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="cross" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <Tag className="w-4 h-4 mr-2" />
              Cross References
            </TabsTrigger>
            <TabsTrigger value="measurements" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <Ruler className="w-4 h-4 mr-2" />
              Measurements
            </TabsTrigger>
            <TabsTrigger value="logistics" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <Package className="w-4 h-4 mr-2" />
              Logistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ImportCard
              title="Products Import"
              description="Import new products (base data only)"
              icon={FileSpreadsheet}
              endpoint="/admin/products/bulk"
              templateColumns="part_number,product_line,description,status"
              templateExample="BD-1234,disc,Brake Disc for VW Golf,developed"
            />
            <div className="mt-4 p-4 bg-[#121212] border border-[#27272A] rounded">
              <h4 className="font-heading text-white uppercase mb-2">Product Lines</h4>
              <p className="text-neutral-400 text-sm font-mono">disc, drum, pad, shoe, caliper</p>
              <h4 className="font-heading text-white uppercase mb-2 mt-4">Status Options</h4>
              <p className="text-neutral-400 text-sm font-mono">developed, not_developed, in_development, new</p>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <ImportCard
              title="Applications Import"
              description="Add vehicle applications to existing products"
              icon={Car}
              endpoint="/admin/bulk/applications"
              templateColumns="part_number,make,vehicle,model,start_year,end_year,vehicle_type"
              templateExample="BD-1234,Volkswagen,Golf,GTI 2.0,2015,2024,Passenger Car"
            />
            <div className="mt-4 p-4 bg-[#121212] border border-[#27272A] rounded">
              <h4 className="font-heading text-white uppercase mb-2">Notes</h4>
              <ul className="text-neutral-400 text-sm list-disc list-inside space-y-1">
                <li>Products must exist before importing applications</li>
                <li>Duplicate applications will be ignored</li>
                <li><span className="font-mono">end_year</span> can be left blank if the vehicle is still in production</li>
                <li><span className="font-mono">model</span> and <span className="font-mono">vehicle_type</span> are optional</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="cross">
            <ImportCard
              title="Cross References Import"
              description="Add competitor codes to existing products"
              icon={Tag}
              endpoint="/admin/bulk/cross-references"
              templateColumns="part_number,manufacturer,code"
              templateExample="BD-1234,TRW,DF6890"
            />
            <div className="mt-4 p-4 bg-[#121212] border border-[#27272A] rounded">
              <h4 className="font-heading text-white uppercase mb-2">Common Manufacturers</h4>
              <p className="text-neutral-400 text-sm font-mono">TRW, Brembo, Bosch, ATE, Ferodo, Cobreq, Fras-le, Hipper Freios</p>
            </div>
          </TabsContent>

          <TabsContent value="measurements">
            <ImportCard
              title="Measurements Import"
              description="Update technical specifications for products"
              icon={Ruler}
              endpoint="/admin/bulk/measurements"
              templateColumns="part_number,outer_diameter,thickness,minimum_thickness,height,center_hole,quantity_holes,pcd,disc_type,drilled,slotted,fitting_position"
              templateExample="BD-1234,312,25,22,47,65,5,112,Internally ventilated,no,no,Front"
            />
            <div className="mt-4 p-4 bg-[#121212] border border-[#27272A] rounded">
              <h4 className="font-heading text-white uppercase mb-2">Measurement Fields by Line</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[#FFB800] font-mono">DISC:</span>
                  <p className="text-neutral-400">outer_diameter, thickness, minimum_thickness, height, center_hole, quantity_holes, pcd, disc_type, drilled, slotted, fitting_position, disc_drum, paired_part_number</p>
                </div>
                <div>
                  <span className="text-[#FFB800] font-mono">DRUM:</span>
                  <p className="text-neutral-400">outer_diameter, inner_diameter, maximum_diameter, height, offset, inner_hole, quantity_holes, fitting_position</p>
                </div>
                <div>
                  <span className="text-[#FFB800] font-mono">PAD:</span>
                  <p className="text-neutral-400">width, height, thickness, acoustic_wear_warning, electronic_wear_sensor, extra_components_included</p>
                </div>
                <div>
                  <span className="text-[#FFB800] font-mono">SHOE:</span>
                  <p className="text-neutral-400">thickness, drum_diameter, width</p>
                </div>
                <div>
                  <span className="text-[#FFB800] font-mono">CALIPER:</span>
                  <p className="text-neutral-400">piston_size, fitting_position, electronic_brake_caliper, paired_part_number</p>
                </div>
              </div>
              <h4 className="font-heading text-white uppercase mb-2 mt-4">Boolean Values</h4>
              <p className="text-neutral-400 text-sm">Use: yes/no, true/false, 1/0, sim/não</p>
            </div>
          </TabsContent>

          <TabsContent value="logistics">
            <ImportCard
              title="Logistics Import"
              description="Update logistics information for products"
              icon={Package}
              endpoint="/admin/bulk/logistics"
              templateColumns="part_number,weight_kg,gross_weight_kg,ean_code,ncm,vpe,packaging_width,packaging_height,packaging_depth,country_of_origin"
              templateExample="BD-1234,4.5,5.2,7891234567890,8708.30.19,1,350,350,50,Brazil"
            />
            <div className="mt-4 p-4 bg-[#121212] border border-[#27272A] rounded">
              <h4 className="font-heading text-white uppercase mb-2">Field Descriptions</h4>
              <ul className="text-neutral-400 text-sm list-disc list-inside space-y-1">
                <li><span className="font-mono">weight_kg</span> - Net weight in kilograms</li>
                <li><span className="font-mono">gross_weight_kg</span> - Gross weight including packaging</li>
                <li><span className="font-mono">ean_code</span> - EAN/UPC barcode (13 digits)</li>
                <li><span className="font-mono">ncm</span> - Brazilian NCM tax code</li>
                <li><span className="font-mono">vpe</span> - Quantity per package</li>
                <li><span className="font-mono">packaging_*</span> - Packaging dimensions in mm</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
