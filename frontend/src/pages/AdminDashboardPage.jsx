import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  LogOut, Plus, Upload, Search, Trash2, Edit, Loader2, 
  Disc, CircleDot, LayoutGrid, Wrench, Settings2,
  Package, BarChart3, ChevronLeft, ChevronRight, X, FileJson, FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  disc: "Disco",
  drum: "Tambor",
  pad: "Pastilha",
  shoe: "Sapata",
  caliper: "Pinça",
};

const statusLabels = {
  developed: "Desenvolvido",
  not_developed: "Não Desenvolvido",
  in_development: "Em Desenvolvimento",
  new: "Novo",
};

const statusClasses = {
  developed: "status-developed",
  not_developed: "status-not-developed",
  in_development: "status-in-development",
  new: "status-new",
};

function StatCard({ title, value, icon: Icon, color = "text-[#FFB800]" }) {
  return (
    <Card className="bg-[#121212] border-[#27272A] hover:border-[#FFB800]/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neutral-500 font-mono text-xs uppercase">{title}</p>
            <p className={`text-3xl font-heading font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`w-10 h-10 ${color} opacity-50`} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProductForm({ product, onSave, onClose }) {
  const [formData, setFormData] = useState(product || {
    part_number: "",
    product_line: "disc",
    description: "",
    status: "developed",
    applications: [],
    cross_references: [],
    measurements: {},
    image_url: "",
    drawing_url: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  
  // New application
  const [newApp, setNewApp] = useState({ brand: "", model: "", year_from: "", year_to: "" });
  // New cross reference
  const [newRef, setNewRef] = useState({ manufacturer: "", code: "" });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: value ? parseFloat(value) : null }
    }));
  };

  const addApplication = () => {
    if (newApp.brand && newApp.model && newApp.year_from && newApp.year_to) {
      setFormData(prev => ({
        ...prev,
        applications: [...prev.applications, {
          ...newApp,
          year_from: parseInt(newApp.year_from),
          year_to: parseInt(newApp.year_to)
        }]
      }));
      setNewApp({ brand: "", model: "", year_from: "", year_to: "" });
    }
  };

  const removeApplication = (index) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index)
    }));
  };

  const addCrossRef = () => {
    if (newRef.manufacturer && newRef.code) {
      setFormData(prev => ({
        ...prev,
        cross_references: [...prev.cross_references, newRef]
      }));
      setNewRef({ manufacturer: "", code: "" });
    }
  };

  const removeCrossRef = (index) => {
    setFormData(prev => ({
      ...prev,
      cross_references: prev.cross_references.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.part_number || !formData.product_line || !formData.description) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      toast.success(product ? "Produto atualizado!" : "Produto criado!");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-400 font-mono text-xs">PART NUMBER *</Label>
          <Input
            value={formData.part_number}
            onChange={(e) => handleChange("part_number", e.target.value.toUpperCase())}
            className="bg-[#09090B] border-[#27272A] font-mono"
            placeholder="Ex: BD-1234"
            data-testid="form-part-number"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-400 font-mono text-xs">LINHA *</Label>
          <Select value={formData.product_line} onValueChange={(v) => handleChange("product_line", v)}>
            <SelectTrigger className="bg-[#09090B] border-[#27272A]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121212] border-[#27272A]">
              <SelectItem value="disc">Disco</SelectItem>
              <SelectItem value="drum">Tambor</SelectItem>
              <SelectItem value="pad">Pastilha</SelectItem>
              <SelectItem value="shoe">Sapata</SelectItem>
              <SelectItem value="caliper">Pinça</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-400 font-mono text-xs">DESCRIÇÃO *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="bg-[#09090B] border-[#27272A] min-h-[80px]"
          placeholder="Descrição do produto..."
          data-testid="form-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-400 font-mono text-xs">STATUS</Label>
          <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
            <SelectTrigger className="bg-[#09090B] border-[#27272A]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121212] border-[#27272A]">
              <SelectItem value="developed">Desenvolvido</SelectItem>
              <SelectItem value="not_developed">Não Desenvolvido</SelectItem>
              <SelectItem value="in_development">Em Desenvolvimento</SelectItem>
              <SelectItem value="new">Novo no Portfólio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-400 font-mono text-xs">URL DA IMAGEM</Label>
          <Input
            value={formData.image_url || ""}
            onChange={(e) => handleChange("image_url", e.target.value)}
            className="bg-[#09090B] border-[#27272A]"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Measurements based on product line */}
      <div className="border-t border-[#27272A] pt-4">
        <h4 className="font-heading text-white uppercase text-sm mb-4">Medidas</h4>
        
        {(formData.product_line === "disc" || formData.product_line === "drum") && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-400 font-mono text-xs">DIÂMETRO EXT. (mm)</Label>
              <Input
                type="number"
                value={formData.measurements?.outer_diameter || ""}
                onChange={(e) => handleMeasurementChange("outer_diameter", e.target.value)}
                className="bg-[#09090B] border-[#27272A] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 font-mono text-xs">ALTURA (mm)</Label>
              <Input
                type="number"
                value={formData.measurements?.height || ""}
                onChange={(e) => handleMeasurementChange("height", e.target.value)}
                className="bg-[#09090B] border-[#27272A] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 font-mono text-xs">ESPESSURA (mm)</Label>
              <Input
                type="number"
                value={formData.measurements?.thickness || ""}
                onChange={(e) => handleMeasurementChange("thickness", e.target.value)}
                className="bg-[#09090B] border-[#27272A] font-mono"
              />
            </div>
            {formData.product_line === "disc" && (
              <>
                <div className="space-y-2">
                  <Label className="text-neutral-400 font-mono text-xs">FURO CENTRAL (mm)</Label>
                  <Input
                    type="number"
                    value={formData.measurements?.center_hole || ""}
                    onChange={(e) => handleMeasurementChange("center_hole", e.target.value)}
                    className="bg-[#09090B] border-[#27272A] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 font-mono text-xs">QTD. FUROS</Label>
                  <Input
                    type="number"
                    value={formData.measurements?.quantity_holes || ""}
                    onChange={(e) => handleMeasurementChange("quantity_holes", e.target.value)}
                    className="bg-[#09090B] border-[#27272A] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 font-mono text-xs">PCD (mm)</Label>
                  <Input
                    type="number"
                    value={formData.measurements?.pcd || ""}
                    onChange={(e) => handleMeasurementChange("pcd", e.target.value)}
                    className="bg-[#09090B] border-[#27272A] font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {formData.product_line === "pad" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-400 font-mono text-xs">LARGURA (mm)</Label>
              <Input
                type="number"
                value={formData.measurements?.width || ""}
                onChange={(e) => handleMeasurementChange("width", e.target.value)}
                className="bg-[#09090B] border-[#27272A] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 font-mono text-xs">ALTURA (mm)</Label>
              <Input
                type="number"
                value={formData.measurements?.height || ""}
                onChange={(e) => handleMeasurementChange("height", e.target.value)}
                className="bg-[#09090B] border-[#27272A] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 font-mono text-xs">ESPESSURA (mm)</Label>
              <Input
                type="number"
                value={formData.measurements?.thickness || ""}
                onChange={(e) => handleMeasurementChange("thickness", e.target.value)}
                className="bg-[#09090B] border-[#27272A] font-mono"
              />
            </div>
          </div>
        )}

        {(formData.product_line === "shoe" || formData.product_line === "caliper") && (
          <p className="text-neutral-500 text-sm font-mono">
            Medidas simplificadas para esta linha de produto.
          </p>
        )}
      </div>

      {/* Applications */}
      <div className="border-t border-[#27272A] pt-4">
        <h4 className="font-heading text-white uppercase text-sm mb-4">Aplicações</h4>
        <div className="grid grid-cols-5 gap-2 mb-2">
          <Input
            placeholder="Marca"
            value={newApp.brand}
            onChange={(e) => setNewApp({ ...newApp, brand: e.target.value })}
            className="bg-[#09090B] border-[#27272A] text-sm"
          />
          <Input
            placeholder="Modelo"
            value={newApp.model}
            onChange={(e) => setNewApp({ ...newApp, model: e.target.value })}
            className="bg-[#09090B] border-[#27272A] text-sm"
          />
          <Input
            placeholder="Ano De"
            type="number"
            value={newApp.year_from}
            onChange={(e) => setNewApp({ ...newApp, year_from: e.target.value })}
            className="bg-[#09090B] border-[#27272A] text-sm font-mono"
          />
          <Input
            placeholder="Ano Até"
            type="number"
            value={newApp.year_to}
            onChange={(e) => setNewApp({ ...newApp, year_to: e.target.value })}
            className="bg-[#09090B] border-[#27272A] text-sm font-mono"
          />
          <Button onClick={addApplication} variant="outline" className="border-[#27272A]">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.applications.length > 0 && (
          <div className="space-y-2 mt-4">
            {formData.applications.map((app, index) => (
              <div key={index} className="flex items-center gap-2 bg-[#09090B] p-2 rounded">
                <span className="flex-1 font-mono text-sm text-neutral-300">
                  {app.brand} {app.model} ({app.year_from}-{app.year_to})
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeApplication(index)}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross References */}
      <div className="border-t border-[#27272A] pt-4">
        <h4 className="font-heading text-white uppercase text-sm mb-4">Referências Cruzadas</h4>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Input
            placeholder="Fabricante"
            value={newRef.manufacturer}
            onChange={(e) => setNewRef({ ...newRef, manufacturer: e.target.value })}
            className="bg-[#09090B] border-[#27272A] text-sm"
          />
          <Input
            placeholder="Código"
            value={newRef.code}
            onChange={(e) => setNewRef({ ...newRef, code: e.target.value.toUpperCase() })}
            className="bg-[#09090B] border-[#27272A] text-sm font-mono"
          />
          <Button onClick={addCrossRef} variant="outline" className="border-[#27272A]">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.cross_references.length > 0 && (
          <div className="space-y-2 mt-4">
            {formData.cross_references.map((ref, index) => (
              <div key={index} className="flex items-center gap-2 bg-[#09090B] p-2 rounded">
                <span className="flex-1 font-mono text-sm text-neutral-300">
                  {ref.manufacturer}: {ref.code}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeCrossRef(index)}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="border-t border-[#27272A] pt-4">
        <Label className="text-neutral-400 font-mono text-xs">OBSERVAÇÕES</Label>
        <Textarea
          value={formData.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="bg-[#09090B] border-[#27272A] min-h-[60px] mt-2"
          placeholder="Observações adicionais..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-[#27272A]">
        <Button variant="outline" className="flex-1 border-[#27272A]" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          className="flex-1 bg-[#FFB800] text-black hover:bg-[#F59E0B]"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="save-product-button"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {product ? "Atualizar" : "Criar"} Produto
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLine, setFilterLine] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const token = localStorage.getItem("admin_token");

  const axiosAuth = axios.create({
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosAuth.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Stats error:", error);
    }
  }, []);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("page_size", 20);
      if (searchQuery) params.set("search", searchQuery);
      if (filterLine) params.set("product_line", filterLine);
      if (filterStatus) params.set("status", filterStatus);

      const response = await axiosAuth.get(`${API}/admin/products?${params.toString()}`);
      setProducts(response.data.items);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
      setCurrentPage(page);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      }
      console.error("Products error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterLine, filterStatus, navigate]);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchProducts(1);
    }
  }, [token, fetchStats, fetchProducts]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const handleCreateProduct = async (data) => {
    await axiosAuth.post(`${API}/admin/products`, data);
    fetchProducts(currentPage);
    fetchStats();
  };

  const handleUpdateProduct = async (data) => {
    await axiosAuth.put(`${API}/admin/products/${editingProduct.id}`, data);
    fetchProducts(currentPage);
    fetchStats();
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await axiosAuth.delete(`${API}/admin/products/${productId}`);
      toast.success("Produto excluído!");
      fetchProducts(currentPage);
      fetchStats();
    } catch (error) {
      toast.error("Erro ao excluir produto");
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await axiosAuth.post(`${API}/admin/products/bulk`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`${response.data.imported} produtos importados!`);
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} erros durante importação`);
      }
      setShowBulkImport(false);
      setImportFile(null);
      fetchProducts(1);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro na importação");
    } finally {
      setImporting(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="logo-container">
              <img src={LOGO_URL} alt="FREMAX" className="h-8 md:h-10" />
            </Link>
            <span className="font-heading text-lg text-white uppercase hidden md:block">
              Painel Administrativo
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="text-neutral-400 hover:text-white transition-colors font-mono text-sm"
            >
              Ver Catálogo
            </Link>
            <Button 
              variant="ghost" 
              className="text-neutral-400 hover:text-white"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total de Produtos" 
              value={stats.total_products} 
              icon={Package}
            />
            <StatCard 
              title="Discos" 
              value={stats.by_product_line?.disc || 0} 
              icon={Disc}
              color="text-blue-400"
            />
            <StatCard 
              title="Pastilhas" 
              value={stats.by_product_line?.pad || 0} 
              icon={LayoutGrid}
              color="text-green-400"
            />
            <StatCard 
              title="Novos" 
              value={stats.by_status?.new || 0} 
              icon={BarChart3}
              color="text-[#FF5F1F]"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 bg-[#121212] border-[#27272A]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchProducts(1)}
                data-testid="admin-search-input"
              />
            </div>
            <Select value={filterLine} onValueChange={(v) => { setFilterLine(v); }}>
              <SelectTrigger className="w-40 bg-[#121212] border-[#27272A]">
                <SelectValue placeholder="Linha" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-[#27272A]">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="disc">Discos</SelectItem>
                <SelectItem value="drum">Tambores</SelectItem>
                <SelectItem value="pad">Pastilhas</SelectItem>
                <SelectItem value="shoe">Sapatas</SelectItem>
                <SelectItem value="caliper">Pinças</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); }}>
              <SelectTrigger className="w-48 bg-[#121212] border-[#27272A]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-[#27272A]">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="developed">Desenvolvido</SelectItem>
                <SelectItem value="not_developed">Não Desenvolvido</SelectItem>
                <SelectItem value="in_development">Em Desenvolvimento</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchProducts(1)} className="bg-[#121212] border border-[#27272A]">
              Filtrar
            </Button>
          </div>
          <div className="flex gap-2">
            <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#27272A]" data-testid="bulk-import-button">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#121212] border-[#27272A] max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading text-white uppercase">Importação em Massa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-neutral-400 text-sm">
                    Faça upload de um arquivo JSON ou CSV com os produtos.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#09090B] border border-[#27272A] p-4 rounded text-center">
                      <FileJson className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                      <span className="text-xs text-neutral-400 font-mono">JSON</span>
                    </div>
                    <div className="bg-[#09090B] border border-[#27272A] p-4 rounded text-center">
                      <FileSpreadsheet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <span className="text-xs text-neutral-400 font-mono">CSV</span>
                    </div>
                  </div>
                  <Input
                    type="file"
                    accept=".json,.csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="bg-[#09090B] border-[#27272A]"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-[#27272A]">Cancelar</Button>
                  </DialogClose>
                  <Button 
                    className="bg-[#FFB800] text-black hover:bg-[#F59E0B]"
                    onClick={handleBulkImport}
                    disabled={importing}
                    data-testid="confirm-import-button"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Importar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogTrigger asChild>
                <Button className="bg-[#FFB800] text-black hover:bg-[#F59E0B]" data-testid="add-product-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#121212] border-[#27272A] max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-white uppercase">Novo Produto</DialogTitle>
                </DialogHeader>
                <ProductForm onSave={handleCreateProduct} onClose={() => setShowAddProduct(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#121212] border border-[#27272A]">
            <Package className="w-16 h-16 text-[#27272A] mx-auto mb-4" />
            <h2 className="font-heading text-2xl text-white uppercase mb-2">Nenhum produto encontrado</h2>
            <p className="text-neutral-500 mb-6">Adicione produtos ou ajuste os filtros</p>
          </div>
        ) : (
          <div className="bg-[#121212] border border-[#27272A] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left py-4 px-4 text-neutral-500 font-mono text-xs uppercase">Part Number</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-mono text-xs uppercase">Linha</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-mono text-xs uppercase hidden md:table-cell">Descrição</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-mono text-xs uppercase">Status</th>
                  <th className="text-right py-4 px-4 text-neutral-500 font-mono text-xs uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const Icon = productLineIcons[product.product_line] || Disc;
                  return (
                    <tr 
                      key={product.id} 
                      className="border-b border-[#27272A] hover:bg-[#18181B] transition-colors"
                      data-testid={`admin-product-row-${product.part_number}`}
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono text-white font-semibold">{product.part_number}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#FFB800]" />
                          <span className="text-neutral-400">{productLineLabels[product.product_line]}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <span className="text-neutral-400 line-clamp-1">{product.description}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${statusClasses[product.status]} status-badge`}>
                          {statusLabels[product.status]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#121212] border-[#27272A] max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="font-heading text-white uppercase">Editar Produto</DialogTitle>
                              </DialogHeader>
                              {editingProduct && (
                                <ProductForm 
                                  product={editingProduct} 
                                  onSave={handleUpdateProduct} 
                                  onClose={() => setEditingProduct(null)} 
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-neutral-500 font-mono text-sm">
              {total} produto{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-[#27272A] bg-[#121212]"
                disabled={currentPage === 1}
                onClick={() => fetchProducts(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <span className="font-mono text-neutral-400">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                className="border-[#27272A] bg-[#121212]"
                disabled={currentPage === totalPages}
                onClick={() => fetchProducts(currentPage + 1)}
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
