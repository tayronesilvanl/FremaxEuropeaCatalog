import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Disc, CircleDot, LayoutGrid, Wrench, Settings2 } from "lucide-react";

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
  disc: "Brake Disc",
  drum: "Brake Drum",
  pad: "Brake Pad",
  shoe: "Brake Shoe",
  caliper: "Brake Caliper",
};

const statusLabels = {
  developed: "Developed",
  not_developed: "Not Developed",
  in_development: "In Development",
  new: "New in Portfolio",
};

const measurementLabels = {
  outer_diameter: "Outer Diameter",
  inner_diameter: "Inner Diameter",
  height: "Height",
  thickness: "Thickness",
  center_hole: "Center Hole",
  quantity_holes: "Qty. Holes",
  pcd: "PCD",
  width: "Width",
  radius: "Radius",
  piston_diameter: "Piston Diameter",
  position: "Position",
};

export default function DatasheetPrintPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const Icon = productLineIcons[product.product_line] || Disc;

  return (
    <div className="min-h-screen bg-white p-8 print:p-4" data-testid="datasheet-print-page">
      {/* Header */}
      <header className="flex items-center justify-between border-b-2 border-[#FFB800] pb-4 mb-8">
        <img src={LOGO_URL} alt="FREMAX" className="h-12" />
        <div className="text-right">
          <p className="font-mono text-xs text-gray-500 uppercase">Technical Datasheet</p>
          <p className="font-bold text-2xl text-black">{product.part_number}</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Image */}
        <div className="col-span-4">
          <div className="border border-gray-200 aspect-square flex items-center justify-center p-4 bg-gray-50">
            {product.image_url ? (
              <img src={product.image_url} alt={product.part_number} className="max-w-full max-h-full object-contain" />
            ) : (
              <Icon className="w-24 h-24 text-gray-300" />
            )}
          </div>
          {product.drawing_url && (
            <div className="mt-4 border border-gray-200 aspect-video flex items-center justify-center p-2 bg-gray-50">
              <img src={product.drawing_url} alt="Technical Drawing" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="col-span-8 space-y-6">
          {/* Product Info */}
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 text-xs font-mono uppercase bg-[#FFB800] text-black">
                {productLineLabels[product.product_line]}
              </span>
              <span className="px-2 py-1 text-xs font-mono uppercase border border-gray-300 text-gray-600">
                {statusLabels[product.status]}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">{product.part_number}</h1>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Technical Specifications */}
          {product.measurements && Object.keys(product.measurements).length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-2 mb-4 uppercase">
                Technical Specifications
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.measurements).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 text-gray-500 w-1/2">{measurementLabels[key] || key}</td>
                      <td className="py-2 font-mono font-semibold text-black">
                        {typeof value === "number" ? `${value} ${key !== "quantity_holes" ? "mm" : ""}` : value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Applications */}
          {product.applications && product.applications.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-2 mb-4 uppercase">
                Vehicle Applications
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left text-gray-500 font-normal">Brand</th>
                    <th className="py-2 text-left text-gray-500 font-normal">Model</th>
                    <th className="py-2 text-left text-gray-500 font-normal">Years</th>
                  </tr>
                </thead>
                <tbody>
                  {product.applications.map((app, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 font-semibold text-black">{app.brand}</td>
                      <td className="py-2 text-black">{app.model}</td>
                      <td className="py-2 font-mono text-gray-600">{app.year_from} - {app.year_to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cross References */}
          {product.cross_references && product.cross_references.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-2 mb-4 uppercase">
                Cross References
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.cross_references.map((ref, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-sm font-mono">
                    <span className="text-gray-500">{ref.manufacturer}:</span> {ref.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Logistics */}
          {product.logistics && (
            <div>
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-2 mb-4 uppercase">
                Logistics Information
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.logistics.weight_kg && (
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <span className="font-mono ml-2">{product.logistics.weight_kg} kg</span>
                  </div>
                )}
                {product.logistics.ean_code && (
                  <div>
                    <span className="text-gray-500">EAN:</span>
                    <span className="font-mono ml-2">{product.logistics.ean_code}</span>
                  </div>
                )}
                {product.logistics.ncm && (
                  <div>
                    <span className="text-gray-500">NCM:</span>
                    <span className="font-mono ml-2">{product.logistics.ncm}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
        <span>FREMAX - The Maximum in Motion</span>
        <span>Generated: {new Date().toLocaleDateString()}</span>
      </footer>
    </div>
  );
}
