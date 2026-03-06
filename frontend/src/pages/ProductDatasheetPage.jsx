import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2, Disc, CircleDot, LayoutGrid, Wrench, Settings2, Car, Tag, Package, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
  disc: "Disco de Freio",
  drum: "Tambor de Freio",
  pad: "Pastilha de Freio",
  shoe: "Sapata de Freio",
  caliper: "Pinça de Freio",
};

const statusLabels = {
  developed: "Desenvolvido",
  not_developed: "Não Desenvolvido",
  in_development: "Em Desenvolvimento",
  new: "Novo no Portfólio",
};

const statusClasses = {
  developed: "status-developed",
  not_developed: "status-not-developed",
  in_development: "status-in-development",
  new: "status-new",
};

const measurementLabels = {
  outer_diameter: "Diâmetro Externo",
  inner_diameter: "Diâmetro Interno",
  height: "Altura",
  thickness: "Espessura",
  center_hole: "Furo Central",
  quantity_holes: "Qtd. Furos",
  pcd: "PCD",
  width: "Largura",
  radius: "Raio",
  piston_diameter: "Diâmetro Pistão",
  position: "Posição",
};

export default function ProductDatasheetPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Produto não encontrado");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <Disc className="w-20 h-20 text-[#27272A] mb-4" />
        <h1 className="font-heading text-3xl text-white uppercase mb-4">Produto não encontrado</h1>
        <Link to="/">
          <Button className="bg-[#FFB800] text-black hover:bg-[#F59E0B]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>
        </Link>
      </div>
    );
  }

  const Icon = productLineIcons[product.product_line] || Disc;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link to="/" className="logo-container shrink-0">
            <img src={LOGO_URL} alt="FREMAX" className="h-8 md:h-10" />
          </Link>
          <Separator orientation="vertical" className="h-8 bg-[#27272A]" />
          <Link 
            to="/search" 
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Resultados
          </Link>
        </div>
      </header>

      {/* Datasheet Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        {/* Product Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`${statusClasses[product.status]} status-badge`}>
                {statusLabels[product.status]}
              </Badge>
              <span className="text-neutral-500 font-mono text-sm">
                {productLineLabels[product.product_line]}
              </span>
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-white uppercase tracking-tight mb-2" data-testid="product-part-number">
              {product.part_number}
            </h1>
            <p className="text-lg text-neutral-400" data-testid="product-description">
              {product.description}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="datasheet-layout">
          {/* Image Area */}
          <div className="datasheet-image-area">
            <div className="bg-[#121212] border border-[#27272A] aspect-square flex items-center justify-center p-8 sticky top-24">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.part_number}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Icon className="w-32 h-32 text-[#27272A]" />
              )}
            </div>
            {product.drawing_url && (
              <div className="mt-4 bg-[#121212] border border-[#27272A] aspect-video flex items-center justify-center p-4">
                <img 
                  src={product.drawing_url} 
                  alt={`Desenho técnico ${product.part_number}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Specs Area */}
          <div className="datasheet-specs-area">
            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-[#121212] border border-[#27272A]">
                <TabsTrigger 
                  value="specs"
                  className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  MEDIDAS
                </TabsTrigger>
                <TabsTrigger 
                  value="applications"
                  className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"
                >
                  <Car className="w-4 h-4 mr-2" />
                  APLICAÇÕES
                </TabsTrigger>
                <TabsTrigger 
                  value="cross"
                  className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  CROSS REF.
                </TabsTrigger>
                <TabsTrigger 
                  value="logistics"
                  className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs"
                >
                  <Package className="w-4 h-4 mr-2" />
                  LOGÍSTICA
                </TabsTrigger>
              </TabsList>

              {/* Measurements Tab */}
              <TabsContent value="specs" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">
                    Especificações Técnicas
                  </h3>
                  {product.measurements && Object.keys(product.measurements).length > 0 ? (
                    <table className="spec-table w-full">
                      <thead>
                        <tr>
                          <th>Dimensão</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(product.measurements).map(([key, value]) => (
                          <tr key={key}>
                            <td className="text-neutral-400">{measurementLabels[key] || key}</td>
                            <td className="text-white font-mono">
                              {typeof value === "number" ? `${value} ${key.includes("diameter") || key.includes("hole") || key.includes("height") || key.includes("thickness") || key.includes("width") || key.includes("radius") || key === "pcd" ? "mm" : ""}` : value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">
                      Medidas não disponíveis para este produto.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">
                    Aplicações por Veículo
                  </h3>
                  {product.applications && product.applications.length > 0 ? (
                    <table className="spec-table w-full">
                      <thead>
                        <tr>
                          <th>Marca</th>
                          <th>Modelo</th>
                          <th>Anos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.applications.map((app, index) => (
                          <tr key={index}>
                            <td className="text-white font-mono">{app.brand}</td>
                            <td className="text-white font-mono">{app.model}</td>
                            <td className="text-neutral-400 font-mono">
                              {app.year_from} - {app.year_to}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">
                      Aplicações não cadastradas para este produto.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Cross References Tab */}
              <TabsContent value="cross" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">
                    Referências Cruzadas
                  </h3>
                  {product.cross_references && product.cross_references.length > 0 ? (
                    <table className="spec-table w-full">
                      <thead>
                        <tr>
                          <th>Fabricante</th>
                          <th>Código</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.cross_references.map((ref, index) => (
                          <tr key={index}>
                            <td className="text-neutral-400">{ref.manufacturer}</td>
                            <td className="text-white font-mono">{ref.code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">
                      Referências cruzadas não cadastradas para este produto.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Logistics Tab */}
              <TabsContent value="logistics" className="mt-6">
                <div className="bg-[#121212] border border-[#27272A] p-6">
                  <h3 className="font-heading text-xl text-white uppercase mb-4">
                    Informações Logísticas
                  </h3>
                  {product.logistics ? (
                    <table className="spec-table w-full">
                      <tbody>
                        {product.logistics.weight_kg && (
                          <tr>
                            <td className="text-neutral-400">Peso</td>
                            <td className="text-white font-mono">{product.logistics.weight_kg} kg</td>
                          </tr>
                        )}
                        {product.logistics.packaging_width && (
                          <tr>
                            <td className="text-neutral-400">Embalagem (LxAxP)</td>
                            <td className="text-white font-mono">
                              {product.logistics.packaging_width} x {product.logistics.packaging_height} x {product.logistics.packaging_depth} mm
                            </td>
                          </tr>
                        )}
                        {product.logistics.ean_code && (
                          <tr>
                            <td className="text-neutral-400">Código EAN</td>
                            <td className="text-white font-mono">{product.logistics.ean_code}</td>
                          </tr>
                        )}
                        {product.logistics.ncm && (
                          <tr>
                            <td className="text-neutral-400">NCM</td>
                            <td className="text-white font-mono">{product.logistics.ncm}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500 font-mono text-sm">
                      Informações logísticas não disponíveis.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Notes */}
            {product.notes && (
              <div className="mt-6 bg-[#121212] border border-[#27272A] p-6">
                <h3 className="font-heading text-xl text-white uppercase mb-4">
                  Observações
                </h3>
                <p className="text-neutral-400 whitespace-pre-wrap">{product.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272A] py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={LOGO_URL} alt="FREMAX" className="h-8" />
          <p className="text-neutral-500 text-sm font-mono">
            © {new Date().getFullYear()} FREMAX - The Maximum in Motion
          </p>
        </div>
      </footer>
    </div>
  );
}
