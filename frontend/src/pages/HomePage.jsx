import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Disc, CircleDot, LayoutGrid, Wrench, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

const productLines = [
  { value: "disc", label: "Discos", icon: Disc },
  { value: "drum", label: "Tambores", icon: CircleDot },
  { value: "pad", label: "Pastilhas", icon: LayoutGrid },
  { value: "shoe", label: "Sapatas", icon: Wrench },
  { value: "caliper", label: "Pinças", icon: Settings2 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("code");
  const [productLine, setProductLine] = useState("");
  
  // Application search
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  
  // Measurement search - Discs
  const [outerDiameter, setOuterDiameter] = useState("");
  const [discThickness, setDiscThickness] = useState("");
  const [centerHole, setCenterHole] = useState("");
  const [quantityHoles, setQuantityHoles] = useState("");
  
  // Measurement search - Pads
  const [padWidth, setPadWidth] = useState("");
  const [padHeight, setPadHeight] = useState("");
  const [padThickness, setPadThickness] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchType === "code" && searchQuery) {
      params.set("q", searchQuery);
    }
    
    if (productLine) params.set("line", productLine);
    
    if (searchType === "application") {
      if (brand) params.set("brand", brand);
      if (model) params.set("model", model);
      if (year) params.set("year", year);
    }
    
    if (searchType === "measurements") {
      if (productLine === "disc") {
        if (outerDiameter) params.set("od", outerDiameter);
        if (discThickness) params.set("dt", discThickness);
        if (centerHole) params.set("ch", centerHole);
        if (quantityHoles) params.set("qh", quantityHoles);
      } else if (productLine === "pad") {
        if (padWidth) params.set("pw", padWidth);
        if (padHeight) params.set("ph", padHeight);
        if (padThickness) params.set("pt", padThickness);
      }
    }
    
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50"></div>
      <div className="noise-overlay"></div>
      
      {/* Header */}
      <header className="relative z-20 border-b border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="logo-container">
            <img src={LOGO_URL} alt="FREMAX" className="h-10 md:h-12" />
          </a>
          <nav className="flex items-center gap-4">
            <a 
              href="/admin/login" 
              className="text-sm text-neutral-400 hover:text-[#FFB800] transition-colors font-mono"
              data-testid="admin-login-link"
            >
              Admin
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="hero-section py-20 md:py-32">
          <div className="hero-content text-center">
            <h1 className="font-heading text-5xl md:text-7xl font-bold text-white uppercase tracking-tight mb-4">
              Catálogo de Produtos
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto">
              Busque por código, aplicação ou medidas. Encontre as especificações técnicas completas de todos os produtos FREMAX.
            </p>

            {/* Search Tabs */}
            <div className="max-w-3xl mx-auto bg-[#121212] border border-[#27272A] p-6 md:p-8" data-testid="search-container">
              <Tabs defaultValue="code" className="w-full" onValueChange={setSearchType}>
                <TabsList className="grid w-full grid-cols-3 bg-[#09090B] mb-6">
                  <TabsTrigger 
                    value="code" 
                    className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs md:text-sm"
                    data-testid="tab-code"
                  >
                    CÓDIGO / REFERÊNCIA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="application"
                    className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs md:text-sm"
                    data-testid="tab-application"
                  >
                    APLICAÇÃO
                  </TabsTrigger>
                  <TabsTrigger 
                    value="measurements"
                    className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black font-mono text-xs md:text-sm"
                    data-testid="tab-measurements"
                  >
                    MEDIDAS
                  </TabsTrigger>
                </TabsList>

                {/* Code/Reference Search */}
                <TabsContent value="code" className="space-y-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Digite o Part Number, código original ou referência..."
                      className="search-input-hero pr-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      data-testid="search-input-code"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#FFB800]" />
                  </div>
                  <div className="flex gap-4">
                    <Select value={productLine} onValueChange={setProductLine}>
                      <SelectTrigger className="flex-1 bg-[#09090B] border-[#27272A] h-12" data-testid="select-product-line">
                        <SelectValue placeholder="Linha de Produto (Opcional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-[#27272A]">
                        <SelectItem value="all">Todas as Linhas</SelectItem>
                        {productLines.map((line) => (
                          <SelectItem key={line.value} value={line.value}>
                            {line.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleSearch}
                      className="h-12 px-8 bg-[#FFB800] text-black hover:bg-[#F59E0B] font-heading uppercase tracking-wider"
                      data-testid="search-button"
                    >
                      Buscar
                    </Button>
                  </div>
                </TabsContent>

                {/* Application Search */}
                <TabsContent value="application" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">MARCA</Label>
                      <Input
                        type="text"
                        placeholder="Ex: Volkswagen"
                        className="bg-[#09090B] border-[#27272A] h-12"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        data-testid="input-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">MODELO</Label>
                      <Input
                        type="text"
                        placeholder="Ex: Golf"
                        className="bg-[#09090B] border-[#27272A] h-12"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        data-testid="input-model"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 font-mono text-xs">ANO</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 2020"
                        className="bg-[#09090B] border-[#27272A] h-12"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        data-testid="input-year"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Select value={productLine} onValueChange={setProductLine}>
                      <SelectTrigger className="flex-1 bg-[#09090B] border-[#27272A] h-12">
                        <SelectValue placeholder="Linha de Produto" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-[#27272A]">
                        <SelectItem value="all">Todas as Linhas</SelectItem>
                        {productLines.map((line) => (
                          <SelectItem key={line.value} value={line.value}>
                            {line.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleSearch}
                      className="h-12 px-8 bg-[#FFB800] text-black hover:bg-[#F59E0B] font-heading uppercase tracking-wider"
                      data-testid="search-button-app"
                    >
                      Buscar
                    </Button>
                  </div>
                </TabsContent>

                {/* Measurements Search */}
                <TabsContent value="measurements" className="space-y-4">
                  <div className="space-y-2 mb-4">
                    <Label className="text-neutral-400 font-mono text-xs">LINHA DE PRODUTO</Label>
                    <Select value={productLine} onValueChange={setProductLine}>
                      <SelectTrigger className="w-full bg-[#09090B] border-[#27272A] h-12">
                        <SelectValue placeholder="Selecione a linha de produto" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-[#27272A]">
                        {productLines.map((line) => (
                          <SelectItem key={line.value} value={line.value}>
                            {line.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Disc Measurements */}
                  {productLine === "disc" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">DIÂMETRO EXT. (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 280"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={outerDiameter}
                          onChange={(e) => setOuterDiameter(e.target.value)}
                          data-testid="input-outer-diameter"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">ESPESSURA (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 22"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={discThickness}
                          onChange={(e) => setDiscThickness(e.target.value)}
                          data-testid="input-disc-thickness"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">FURO CENTRAL (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 65"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={centerHole}
                          onChange={(e) => setCenterHole(e.target.value)}
                          data-testid="input-center-hole"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">QTD. FUROS</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 5"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={quantityHoles}
                          onChange={(e) => setQuantityHoles(e.target.value)}
                          data-testid="input-quantity-holes"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pad Measurements */}
                  {productLine === "pad" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">LARGURA (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 155"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={padWidth}
                          onChange={(e) => setPadWidth(e.target.value)}
                          data-testid="input-pad-width"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">ALTURA (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 60"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={padHeight}
                          onChange={(e) => setPadHeight(e.target.value)}
                          data-testid="input-pad-height"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">ESPESSURA (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 17"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={padThickness}
                          onChange={(e) => setPadThickness(e.target.value)}
                          data-testid="input-pad-thickness"
                        />
                      </div>
                    </div>
                  )}

                  {/* Drum Measurements */}
                  {productLine === "drum" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">DIÂMETRO EXTERNO (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 200"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={outerDiameter}
                          onChange={(e) => setOuterDiameter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 font-mono text-xs">ALTURA (mm)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 50"
                          className="bg-[#09090B] border-[#27272A] h-12 font-mono"
                          value={discThickness}
                          onChange={(e) => setDiscThickness(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {(productLine === "shoe" || productLine === "caliper") && (
                    <p className="text-neutral-500 text-sm font-mono">
                      Busca por medidas não disponível para esta linha. Use busca por código ou aplicação.
                    </p>
                  )}

                  {!productLine && (
                    <p className="text-neutral-500 text-sm font-mono">
                      Selecione uma linha de produto para ver os filtros de medidas.
                    </p>
                  )}

                  <Button 
                    onClick={handleSearch}
                    className="w-full h-12 bg-[#FFB800] text-black hover:bg-[#F59E0B] font-heading uppercase tracking-wider"
                    disabled={!productLine || productLine === "shoe" || productLine === "caliper"}
                    data-testid="search-button-measurements"
                  >
                    Buscar por Medidas
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Product Lines Section */}
        <section className="py-16 px-6 border-t border-[#27272A]">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white uppercase tracking-tight mb-8 text-center">
              Linhas de Produto
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {productLines.map((line) => {
                const Icon = line.icon;
                return (
                  <button
                    key={line.value}
                    onClick={() => navigate(`/search?line=${line.value}`)}
                    className="group bg-[#121212] border border-[#27272A] p-6 hover:border-[#FFB800]/50 transition-all duration-300"
                    data-testid={`product-line-${line.value}`}
                  >
                    <Icon className="w-10 h-10 text-[#FFB800] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-heading text-lg uppercase text-white">{line.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#27272A] py-8 px-6">
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
