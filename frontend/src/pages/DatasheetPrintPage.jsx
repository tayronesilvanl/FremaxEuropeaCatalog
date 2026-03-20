import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Disc, CircleDot, LayoutGrid, Wrench, Settings2, Download, Printer } from "lucide-react";
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
    return mmFields.includes(key) ? `${value} mm` : `${value}`;
  }
  return value || "-";
}

async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function loadLogoBase64() {
  return await loadImageAsBase64(LOGO_URL);
}

function drawHeader(pdf, partNumber, logoBase64, pageW) {
  // Logo
  if (logoBase64) {
    try { pdf.addImage(logoBase64, "PNG", 15, 10, 45, 12); } catch {}
  }
  // Orange line
  pdf.setDrawColor(255, 184, 0);
  pdf.setLineWidth(0.8);
  pdf.line(15, 26, pageW - 15, 26);
  // Part number top right
  pdf.setFontSize(8);
  pdf.setTextColor(130, 130, 130);
  pdf.text("TECHNICAL DATASHEET", pageW - 15, 14, { align: "right" });
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.text(partNumber, pageW - 15, 22, { align: "right" });
  pdf.setFont("helvetica", "normal");
  return 32;
}

function drawFooter(pdf, pageW, pageH, pageNum) {
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(15, pageH - 15, pageW - 15, pageH - 15);
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text("FREMAX - The Maximum in Motion", 15, pageH - 10);
  pdf.text(`Page ${pageNum}`, pageW / 2, pageH - 10, { align: "center" });
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 15, pageH - 10, { align: "right" });
}

async function generatePDF(product) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const logoBase64 = await loadLogoBase64();
  const margin = 15;
  const contentW = pageW - 2 * margin;

  // ========== PAGE 1: Product Info + Specs + Logistics ==========
  let y = drawHeader(pdf, product.part_number, logoBase64, pageW);

  // Product line badge + status
  pdf.setFillColor(255, 184, 0);
  pdf.rect(margin, y, 30, 6, "F");
  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.text((productLineLabels[product.product_line] || "").toUpperCase(), margin + 15, y + 4, { align: "center" });
  
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(margin + 33, y, 25, 6);
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont("helvetica", "normal");
  pdf.text((statusLabels[product.status] || "").toUpperCase(), margin + 45.5, y + 4, { align: "center" });

  if (product.measurements?.fitting_position) {
    pdf.setDrawColor(255, 184, 0);
    pdf.rect(margin + 61, y, 18, 6);
    pdf.setTextColor(200, 140, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(product.measurements.fitting_position.toUpperCase(), margin + 70, y + 4, { align: "center" });
  }
  
  y += 12;

  // Part number title
  pdf.setFontSize(22);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.text(product.part_number, margin, y);
  y += 7;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(product.description || "", margin, y);
  y += 10;

  // Images side by side
  const imgW = contentW / 2 - 3;
  const imgH = 55;
  let imgLoaded = false;

  if (product.image_url) {
    const imgData = await loadImageAsBase64(product.image_url);
    if (imgData) {
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, y, imgW, imgH);
      try { pdf.addImage(imgData, "JPEG", margin + 2, y + 2, imgW - 4, imgH - 4); imgLoaded = true; } catch {}
    }
  }
  if (product.drawing_url) {
    const drawData = await loadImageAsBase64(product.drawing_url);
    if (drawData) {
      const xOffset = margin + imgW + 6;
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(xOffset, y, imgW, imgH);
      try { pdf.addImage(drawData, "JPEG", xOffset + 2, y + 2, imgW - 4, imgH - 4); imgLoaded = true; } catch {}
    }
  }
  if (imgLoaded) y += imgH + 8;

  // Technical Specifications
  const specs = product.measurements ? Object.entries(product.measurements).filter(([,v]) => v !== null && v !== "") : [];
  if (specs.length > 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text("TECHNICAL SPECIFICATIONS", margin, y);
    y += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;

    pdf.setFontSize(9);
    specs.forEach(([key, value]) => {
      if (y > pageH - 30) { drawFooter(pdf, pageW, pageH, 1); pdf.addPage(); y = drawHeader(pdf, product.part_number, logoBase64, pageW); }
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(measurementLabels[key] || key, margin, y);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(formatValue(key, value), pageW / 2, y);
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, y + 2, pageW - margin, y + 2);
      y += 7;
    });
    y += 4;
  }

  // Logistics
  if (product.logistics) {
    const logItems = [];
    if (product.logistics.weight_kg) logItems.push(["Weight", `${product.logistics.weight_kg} kg`]);
    if (product.logistics.gross_weight_kg) logItems.push(["Gross Weight", `${product.logistics.gross_weight_kg} kg`]);
    if (product.logistics.vpe) logItems.push(["VPE", `${product.logistics.vpe}`]);
    if (product.logistics.ean_code) logItems.push(["EAN Code", product.logistics.ean_code]);
    if (product.logistics.ncm) logItems.push(["NCM", product.logistics.ncm]);
    if (product.logistics.country_of_origin) logItems.push(["Country", product.logistics.country_of_origin]);
    if (product.logistics.packaging_width) logItems.push(["Packaging (WxHxD)", `${product.logistics.packaging_width} x ${product.logistics.packaging_height} x ${product.logistics.packaging_depth} mm`]);

    if (logItems.length > 0) {
      if (y > pageH - 50) { drawFooter(pdf, pageW, pageH, 1); pdf.addPage(); y = drawHeader(pdf, product.part_number, logoBase64, pageW); }
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("LOGISTICS INFORMATION", margin, y);
      y += 2;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageW - margin, y);
      y += 5;

      pdf.setFontSize(9);
      logItems.forEach(([label, val]) => {
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 100, 100);
        pdf.text(label, margin, y);
        pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
        pdf.text(val, pageW / 2, y);
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, y + 2, pageW - margin, y + 2);
        y += 7;
      });
    }
  }

  drawFooter(pdf, pageW, pageH, 1);

  // ========== PAGE 2: Applications + OES (Cross References) ==========
  pdf.addPage();
  y = drawHeader(pdf, product.part_number, logoBase64, pageW);

  // Applications
  if (product.applications && product.applications.length > 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text("VEHICLE APPLICATIONS", margin, y);
    y += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;

    // Table header
    const cols = [margin, margin + 35, margin + 70, margin + 105, margin + 140];
    pdf.setFontSize(7);
    pdf.setTextColor(130, 130, 130);
    pdf.setFont("helvetica", "normal");
    ["MAKE", "VEHICLE", "MODEL", "YEARS", "TYPE"].forEach((h, i) => pdf.text(h, cols[i], y));
    y += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;

    pdf.setFontSize(9);
    product.applications.forEach((app) => {
      if (y > pageH - 25) { drawFooter(pdf, pageW, pageH, 2); pdf.addPage(); y = drawHeader(pdf, product.part_number, logoBase64, pageW); }
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
      pdf.text(app.make || app.brand || "", cols[0], y);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(50, 50, 50);
      pdf.text(app.vehicle || "", cols[1], y);
      pdf.text(app.model || "-", cols[2], y);
      pdf.setTextColor(100, 100, 100);
      const years = `${app.start_year || app.year_from || ""}${(app.end_year || app.year_to) ? ` - ${app.end_year || app.year_to}` : " \u2192"}`;
      pdf.text(years, cols[3], y);
      pdf.text(app.vehicle_type || "-", cols[4], y);
      pdf.setDrawColor(240, 240, 240);
      pdf.line(margin, y + 2, pageW - margin, y + 2);
      y += 7;
    });
    y += 8;
  }

  // Cross References (OES)
  if (product.cross_references && product.cross_references.length > 0) {
    if (y > pageH - 40) { drawFooter(pdf, pageW, pageH, 2); pdf.addPage(); y = drawHeader(pdf, product.part_number, logoBase64, pageW); }
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text("OES / CROSS REFERENCES", margin, y);
    y += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;

    const refColW = 58;
    const refsPerRow = 3;
    pdf.setFontSize(8);
    
    product.cross_references.forEach((ref, i) => {
      const col = i % refsPerRow;
      const x = margin + col * refColW;
      
      if (col === 0 && i > 0) y += 9;
      if (y > pageH - 25) { drawFooter(pdf, pageW, pageH, 2); pdf.addPage(); y = drawHeader(pdf, product.part_number, logoBase64, pageW); }

      // Badge background
      pdf.setFillColor(245, 245, 245);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(x, y - 4, refColW - 3, 8, 1, 1, "FD");
      
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(130, 130, 130);
      pdf.text(`${ref.manufacturer}:`, x + 2, y);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(ref.code, x + 2 + pdf.getTextWidth(`${ref.manufacturer}: `), y);
    });
  }

  drawFooter(pdf, pageW, pageH, 2);
  pdf.save(`FREMAX_${product.part_number}_Datasheet.pdf`);
}

export default function DatasheetPrintPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    axios.get(`${API}/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try { await generatePDF(product); } catch (e) { console.error("PDF error:", e); }
    finally { setGenerating(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" /></div>;
  if (!product) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><p className="text-neutral-500">Product not found</p></div>;

  const Icon = productLineIcons[product.product_line] || Disc;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Action Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-[#121212] border-b border-[#27272A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="FREMAX" className="h-8" />
          <span className="text-neutral-400 font-mono text-sm">Technical Datasheet</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadPDF} disabled={generating} className="flex items-center gap-2 px-5 py-2 bg-[#FFB800] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#F59E0B] transition-colors disabled:opacity-50" data-testid="download-pdf-button">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? "Generating..." : "Download PDF"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2 border border-[#27272A] text-neutral-300 font-bold text-sm uppercase tracking-wider hover:border-[#FFB800] hover:text-[#FFB800] transition-colors" data-testid="print-button">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Online Dark Datasheet Preview */}
      <div className="max-w-[1000px] mx-auto bg-[#0A0A0A] p-8" data-testid="datasheet-print-page">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-[#FFB800] pb-4 mb-8">
          <img src={LOGO_URL} alt="FREMAX" className="h-12" />
          <div className="text-right">
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">Technical Datasheet</p>
            <p className="font-bold text-2xl text-white">{product.part_number}</p>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Images */}
          <div className="col-span-4 space-y-4">
            <div className="border border-[#27272A] aspect-square flex items-center justify-center p-4 bg-[#121212]">
              {product.image_url ? <img src={product.image_url} alt={product.part_number} className="max-w-full max-h-full object-contain" /> : <Icon className="w-24 h-24 text-[#27272A]" />}
            </div>
            {product.drawing_url && (
              <div className="border border-[#27272A] aspect-video flex items-center justify-center p-2 bg-[#121212]">
                <img src={product.drawing_url} alt="Drawing" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 text-xs font-mono uppercase font-bold bg-[#FFB800] text-black">{productLineLabels[product.product_line]}</span>
                <span className="px-3 py-1 text-xs font-mono uppercase border border-[#27272A] text-neutral-400">{statusLabels[product.status]}</span>
                {product.measurements?.fitting_position && <span className="px-3 py-1 text-xs font-mono uppercase border border-[#FFB800]/30 text-[#FFB800]">{product.measurements.fitting_position}</span>}
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">{product.part_number}</h1>
              <p className="text-neutral-400">{product.description}</p>
            </div>

            {/* Specs */}
            {product.measurements && Object.keys(product.measurements).length > 0 && (
              <div>
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">Technical Specifications</h2>
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
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">Vehicle Applications</h2>
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
                    {product.applications.map((app, i) => (
                      <tr key={i} className="border-b border-[#1a1a1a]">
                        <td className="py-2 font-semibold text-white">{app.make || app.brand}</td>
                        <td className="py-2 text-[#FFB800]">{app.vehicle || ""}</td>
                        <td className="py-2 text-neutral-300">{app.model || "-"}</td>
                        <td className="py-2 font-mono text-neutral-400">{app.start_year || app.year_from}{(app.end_year || app.year_to) ? ` - ${app.end_year || app.year_to}` : " \u2192"}</td>
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
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">OES / Cross References</h2>
                <div className="flex flex-wrap gap-2">
                  {product.cross_references.map((ref, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#121212] border border-[#27272A] text-sm font-mono">
                      <span className="text-neutral-500">{ref.manufacturer}:</span> <span className="text-white font-semibold">{ref.code}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics */}
            {product.logistics && (
              <div>
                <h2 className="text-base font-bold text-[#FFB800] border-b border-[#27272A] pb-2 mb-4 uppercase tracking-wider">Logistics Information</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {product.logistics.weight_kg && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">Weight</span><span className="font-mono text-white">{product.logistics.weight_kg} kg</span></div>}
                  {product.logistics.gross_weight_kg && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">Gross Weight</span><span className="font-mono text-white">{product.logistics.gross_weight_kg} kg</span></div>}
                  {product.logistics.vpe && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">VPE</span><span className="font-mono text-white">{product.logistics.vpe}</span></div>}
                  {product.logistics.ean_code && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">EAN Code</span><span className="font-mono text-white">{product.logistics.ean_code}</span></div>}
                  {product.logistics.ncm && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">NCM</span><span className="font-mono text-white">{product.logistics.ncm}</span></div>}
                  {product.logistics.country_of_origin && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">Country</span><span className="font-mono text-white">{product.logistics.country_of_origin}</span></div>}
                  {product.logistics.packaging_width && <div className="flex justify-between py-1 border-b border-[#1a1a1a]"><span className="text-neutral-500">Packaging</span><span className="font-mono text-white">{product.logistics.packaging_width}x{product.logistics.packaging_height}x{product.logistics.packaging_depth} mm</span></div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-10 pt-4 border-t border-[#27272A] flex items-center justify-between text-xs text-neutral-600">
          <span className="font-mono">FREMAX - The Maximum in Motion</span>
          <span className="font-mono">Generated: {new Date().toLocaleDateString()}</span>
        </footer>
      </div>
    </div>
  );
}
