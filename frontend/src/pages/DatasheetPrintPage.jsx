import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Disc, CircleDot, LayoutGrid, Wrench, Settings2, Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

const productLineIcons = { disc: Disc, drum: CircleDot, pad: LayoutGrid, shoe: Wrench, caliper: Settings2 };
const productLineLabels = { disc: "Brake Disc", drum: "Brake Drum", pad: "Brake Pad", shoe: "Brake Shoe", caliper: "Brake Caliper" };
const statusLabels = { developed: "Developed", not_developed: "Not Developed", in_development: "In Development", new: "New in Portfolio" };
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

function formatValue(key, value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const mmFields = ["outer_diameter","inner_diameter","height","thickness","center_hole","pcd","width","minimum_thickness","maximum_diameter","offset","inner_hole","piston_size","drum_diameter"];
    return mmFields.includes(key) ? `${value} mm` : value;
  }
  return value || "-";
}

export default function DatasheetPrintPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPDF = async () => {
    if (!contentRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: "#0A0A0A",
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      } else {
        while (position < pdfHeight) {
          if (position > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, -position, pdfWidth, pdfHeight);
          position += pageHeight;
        }
      }
      pdf.save(`FREMAX_${product.part_number}_Datasheet.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" /></div>;
  if (!product) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><p className="text-neutral-500">Product not found</p></div>;

  const Icon = productLineIcons[product.product_line] || Disc;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Action Bar - hidden on print */}
      <div className="print:hidden sticky top-0 z-50 bg-[#121212] border-b border-[#27272A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="FREMAX" className="h-8" />
          <span className="text-neutral-400 font-mono text-sm">Technical Datasheet</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadPDF}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2 bg-[#FFB800] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#F59E0B] transition-colors disabled:opacity-50"
            data-testid="download-pdf-button"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 border border-[#27272A] text-neutral-300 font-bold text-sm uppercase tracking-wider hover:border-[#FFB800] hover:text-[#FFB800] transition-colors"
            data-testid="print-button"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Datasheet Content */}
      <div ref={contentRef} className="max-w-[1000px] mx-auto bg-[#0A0A0A] p-8 print:p-6" data-testid="datasheet-print-page">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-[#FFB800] pb-4 mb-8">
          <img src={LOGO_URL} alt="FREMAX" className="h-12" />
          <div className="text-right">
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">Technical Datasheet</p>
            <p className="font-bold text-2xl text-white">{product.part_number}</p>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Images */}
          <div className="col-span-4 space-y-4">
            <div className="border border-[#27272A] aspect-square flex items-center justify-center p-4 bg-[#121212]">
              {product.image_url ? (
                <img src={product.image_url} alt={product.part_number} className="max-w-full max-h-full object-contain" />
              ) : (
                <Icon className="w-24 h-24 text-[#27272A]" />
              )}
            </div>
            {product.drawing_url && (
              <div className="border border-[#27272A] aspect-video flex items-center justify-center p-2 bg-[#121212]">
                <img src={product.drawing_url} alt="Technical Drawing" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="col-span-8 space-y-6">
            {/* Product Info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 text-xs font-mono uppercase font-bold bg-[#FFB800] text-black">
                  {productLineLabels[product.product_line]}
                </span>
                <span className="px-3 py-1 text-xs font-mono uppercase border border-[#27272A] text-neutral-400">
                  {statusLabels[product.status]}
                </span>
                {product.measurements?.fitting_position && (
                  <span className="px-3 py-1 text-xs font-mono uppercase border border-[#FFB800]/30 text-[#FFB800]">
                    {product.measurements.fitting_position}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">{product.part_number}</h1>
              <p className="text-neutral-400">{product.description}</p>
            </div>

            {/* Technical Specifications */}
            {product.measurements && Object.keys(product.measurements).length > 0 && (
              <div>
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">
                  Technical Specifications
                </h2>
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.measurements).filter(([,v]) => v !== null && v !== "").map(([key, value]) => (
                      <tr key={key} className="border-b border-[#1a1a1a]">
                        <td className="py-2 text-neutral-500 w-1/2">{measurementLabels[key] || key}</td>
                        <td className="py-2 font-mono font-semibold text-white">{formatValue(key, value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Applications */}
            {product.applications && product.applications.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">
                  Vehicle Applications
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#27272A]">
                      <th className="py-2 text-left text-neutral-500 font-normal text-xs uppercase">Make</th>
                      <th className="py-2 text-left text-neutral-500 font-normal text-xs uppercase">Vehicle</th>
                      <th className="py-2 text-left text-neutral-500 font-normal text-xs uppercase">Model</th>
                      <th className="py-2 text-left text-neutral-500 font-normal text-xs uppercase">Years</th>
                      <th className="py-2 text-left text-neutral-500 font-normal text-xs uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.applications.map((app, index) => (
                      <tr key={index} className="border-b border-[#1a1a1a]">
                        <td className="py-2 font-semibold text-white">{app.make || app.brand}</td>
                        <td className="py-2 text-[#FFB800]">{app.vehicle || ""}</td>
                        <td className="py-2 text-neutral-300">{app.model || "-"}</td>
                        <td className="py-2 font-mono text-neutral-400">
                          {app.start_year || app.year_from}{(app.end_year || app.year_to) ? ` - ${app.end_year || app.year_to}` : " \u2192"}
                        </td>
                        <td className="py-2 text-neutral-500">{app.vehicle_type || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cross References */}
            {product.cross_references && product.cross_references.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">
                  Cross References
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.cross_references.map((ref, index) => (
                    <span key={index} className="px-3 py-1.5 bg-[#121212] border border-[#27272A] text-sm font-mono">
                      <span className="text-neutral-500">{ref.manufacturer}:</span>{" "}
                      <span className="text-white font-semibold">{ref.code}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics */}
            {product.logistics && (
              <div>
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">
                  Logistics Information
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {product.logistics.weight_kg && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">Weight</span>
                      <span className="font-mono text-white">{product.logistics.weight_kg} kg</span>
                    </div>
                  )}
                  {product.logistics.gross_weight_kg && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">Gross Weight</span>
                      <span className="font-mono text-white">{product.logistics.gross_weight_kg} kg</span>
                    </div>
                  )}
                  {product.logistics.vpe && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">VPE</span>
                      <span className="font-mono text-white">{product.logistics.vpe}</span>
                    </div>
                  )}
                  {product.logistics.ean_code && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">EAN Code</span>
                      <span className="font-mono text-white">{product.logistics.ean_code}</span>
                    </div>
                  )}
                  {product.logistics.ncm && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">NCM</span>
                      <span className="font-mono text-white">{product.logistics.ncm}</span>
                    </div>
                  )}
                  {product.logistics.country_of_origin && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">Country</span>
                      <span className="font-mono text-white">{product.logistics.country_of_origin}</span>
                    </div>
                  )}
                  {product.logistics.packaging_width && (
                    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                      <span className="text-neutral-500">Packaging (WxHxD)</span>
                      <span className="font-mono text-white">{product.logistics.packaging_width} x {product.logistics.packaging_height} x {product.logistics.packaging_depth} mm</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t border-[#27272A] flex items-center justify-between text-xs text-neutral-600">
          <span className="font-mono">FREMAX - The Maximum in Motion</span>
          <span className="font-mono">Generated: {new Date().toLocaleDateString()}</span>
        </footer>
      </div>
    </div>
  );
}
