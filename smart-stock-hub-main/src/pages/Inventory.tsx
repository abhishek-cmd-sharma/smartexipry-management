import { useState, Fragment } from "react";
import { 
  Plus, Pencil, Trash2, Search, Package, PackageSearch, 
  AlertCircle, ChevronDown, ChevronRight, Layers, 
  Percent, IndianRupee, Calendar, Tag, Edit3, X, 
  Check, Clock, Sparkles, XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = ["Dairy", "Snacks", "Beverages", "Grains", "Personal Care", "Household"];

// Extended product type with discount fields (managed locally)
interface ProductWithDiscount {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  // Discount fields (stored locally)
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  batch_details?: string;
}

function getExpiryStatus(expiryDate: string) {
  const diff = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "expired";
  if (diff <= 7) return "critical";
  if (diff <= 30) return "warning";
  return "safe";
}

function isDiscountActive(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

function calculateFinalPrice(price: number, discountType?: "percentage" | "fixed" | null, discountValue?: number): number {
  if (!discountType || !discountValue || discountValue <= 0) return price;
  if (discountType === "percentage") {
    return Math.max(0, price - (price * discountValue / 100));
  }
  return Math.max(0, price - discountValue);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Inventory() {
  const { data: products = [], isLoading } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Local state for discount management (extends products)
  const [productsWithDiscounts, setProductsWithDiscounts] = useState<Record<string, ProductWithDiscount>>({});
  
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDiscount, setFilterDiscount] = useState("all");
  
  // Product Edit Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: "", category: "", price: "", quantity: "", expiry_date: "", batch_details: "", brand: "", barcode: ""
  });

  // Discount Dialog
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountProductId, setDiscountProductId] = useState<string | null>(null);
  const [discountForm, setDiscountForm] = useState({
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    discount_start_date: "",
    discount_end_date: ""
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Merge products with local discount data
  const getProductWithDiscount = (product: any): ProductWithDiscount => {
    return productsWithDiscounts[product.id] || { ...product };
  };

  // Group products into batches
  const groupedProducts = products.reduce((acc, p) => {
    const productWithDiscount = getProductWithDiscount(p);
    const key = p.name;
    if (!acc[key]) {
      acc[key] = {
        name: p.name,
        category: p.category,
        price: p.price,
        totalQuantity: 0,
        batches: [],
        discount_type: productWithDiscount.discount_type,
        discount_value: productWithDiscount.discount_value,
        discount_start_date: productWithDiscount.discount_start_date,
        discount_end_date: productWithDiscount.discount_end_date,
      };
    }
    acc[key].totalQuantity += p.quantity;
    acc[key].batches.push({ ...p, ...productsWithDiscounts[p.id] });
    return acc;
  }, {} as Record<string, any>);

  const groupedArray = Object.values(groupedProducts);

  const filtered = groupedArray.filter((g: any) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || g.category === filterCategory;
    
    // Filter by discount status
    const hasActiveDiscount = isDiscountActive(g.discount_start_date, g.discount_end_date);
    if (filterDiscount === "active" && !hasActiveDiscount) return false;
    if (filterDiscount === "inactive" && hasActiveDiscount) return false;
    
    return matchSearch && matchCat;
  });

  const toggleExpand = (name: string) => {
    setExpanded(e => ({ ...e, [name]: !e[name] }));
  };

  function openAdd() {
    setEditId(null);
    setForm({ name: "", category: "", price: "", quantity: "", expiry_date: "", batch_details: "" });
    setDialogOpen(true);
  }

  function openAddBatch(productGroup: any) {
    setEditId(null);
    setForm({
      name: productGroup.name,
      category: productGroup.category,
      price: String(productGroup.price),
      quantity: "",
      expiry_date: "",
      batch_details: ""
      , brand: "", barcode: ""
    });
    setDialogOpen(true);
  }

  function openEdit(p: typeof products[0]) {
    setEditId(p.id);
    const discountData: any = productsWithDiscounts[p.id] || {};
    setForm({
      name: p.name, 
      category: p.category,
      price: String(p.price), 
      quantity: String(p.quantity), 
      expiry_date: p.expiry_date,
      batch_details: discountData.batch_details || "",
      brand: discountData.brand || "",
      barcode: discountData.barcode || ""
    });
    setDialogOpen(true);
  }

  function openDiscountDialog(productId: string, product: any) {
    setDiscountProductId(productId);
    const discountData: any = productsWithDiscounts[productId] || {};
    setDiscountForm({
      discount_type: discountData.discount_type || "percentage",
      discount_value: discountData.discount_value?.toString() || "",
      discount_start_date: discountData.discount_start_date || "",
      discount_end_date: discountData.discount_end_date || ""
    });
    setDiscountDialogOpen(true);
  }

  function applyDiscount() {
    if (!discountProductId) return;
    if (!discountForm.discount_value || !discountForm.discount_start_date || !discountForm.discount_end_date) {
      toast.error("Please fill in all discount fields");
      return;
    }
    
    const product = products.find(p => p.id === discountProductId);
    if (!product) return;
    
    setProductsWithDiscounts(prev => ({
      ...prev,
      [discountProductId]: {
        ...prev[discountProductId] || product,
        discount_type: discountForm.discount_type,
        discount_value: Number(discountForm.discount_value),
        discount_start_date: discountForm.discount_start_date,
        discount_end_date: discountForm.discount_end_date
      }
    }));
    
    setDiscountDialogOpen(false);
    toast.success("Discount applied successfully");
  }

  function removeDiscount(productId: string) {
    setProductsWithDiscounts(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
    toast.success("Discount removed");
  }

  function getGroupExpiryStatus(totalQuantity: number, batches: any[]) {
    if (totalQuantity === 0) return "out-of-stock";
    const activeBatches = batches.filter((b: any) => b.quantity > 0);
    if (activeBatches.some((b: any) => getExpiryStatus(b.expiry_date) === "expired")) return "expired";
    if (activeBatches.some((b: any) => getExpiryStatus(b.expiry_date) === "critical")) return "critical";
    if (activeBatches.some((b: any) => getExpiryStatus(b.expiry_date) === "warning")) return "warning";
    return "safe";
  }

  async function handleSave() {
    if (!form.name || !form.category || !form.price || !form.quantity || !form.expiry_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editId) {
        // Update product with batch details if provided
        const updateData: any = {
          id: editId, 
          name: form.name, 
          category: form.category,
          price: Number(form.price), 
          quantity: Number(form.quantity), 
          expiry_date: form.expiry_date,
        };
        
        // Update local discount/batch details
        setProductsWithDiscounts(prev => ({
          ...prev,
          [editId]: {
            ...prev[editId] || {},
            ...updateData,
            batch_details: form.batch_details
          }
        }));
        
        await updateProduct.mutateAsync(updateData);
        toast.success("Product updated");
      } else {
        const created = await addProduct.mutateAsync({
          name: form.name,
          category: form.category,
          price: Number(form.price),
          quantity: Number(form.quantity),
          expiry_date: form.expiry_date,
        });

        // Persist brand / barcode locally in productsWithDiscounts for display
        if (created && created.id) {
          setProductsWithDiscounts(prev => ({
            ...prev,
            [created.id]: {
              ...prev[created.id] || {},
              batch_details: form.batch_details || prev[created.id]?.batch_details || "",
              brand: form.brand || prev[created.id]?.brand || "",
              barcode: form.barcode || prev[created.id]?.barcode || "",
            }
          }));
        }

        toast.success("Product added");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct.mutateAsync(id);
      // Clean up discount data
      setProductsWithDiscounts(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      toast.success("Product removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // Delete all batches for a product group
  async function deleteGroup(productGroup: any) {
    const ok = window.confirm(`Delete all batches of "${productGroup.name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      for (const b of productGroup.batches) {
        await deleteProduct.mutateAsync(b.id);
        setProductsWithDiscounts(prev => {
          const newState = { ...prev };
          delete newState[b.id];
          return newState;
        });
      }
      toast.success(`Deleted ${productGroup.batches.length} batches`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading inventory...</div>;

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleBarcodeLookup(code: string) {
    setForm(f => ({ ...f, barcode: code }));
    // Try OpenFoodFacts lookup
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const json = await res.json();
      if (json && json.status === 1 && json.product) {
        const prod = json.product;
        const pname = prod.product_name || prod.generic_name || '';
        const brand = prod.brands || prod.brands_tags?.[0] || '';
        // categories_tags often include category-like strings
        const categories = prod.categories_tags || prod.categories || [];

        // Map categories to local categories if possible
        let mappedCategory = '';
        for (const c of categories) {
          for (const local of categories) { }
        }

        // Simple mapping: pick first local category that appears in categories tags (case-insensitive)
        const tags = (categories || []).map((t: string) => t.toLowerCase());
        let matched = categories.find((t: any) => {
          return categoriesListNormalized.some((lc: string) => t.toLowerCase().includes(lc));
        });

        // use a helper normalized categories list from top scope
        // Fallbacks
        const inferredCategory = (prod.categories && prod.categories.split(',').map((s: string) => s.trim())[0]) || '';

        setForm(f => ({ ...f, name: pname || f.name, brand: brand || f.brand, category: inferredCategory || f.category }));
        toast.success('Product details auto-filled from barcode');
      } else {
        setScanError('No product details found for this barcode');
      }
    } catch (err: any) {
      setScanError(err.message || 'Lookup failed');
    }
  }

  // category helper: normalized local categories
  const categoriesListNormalized = categories.map(c => c.toLowerCase());

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto"
      >
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Inventory Management
            </h1>
            <p className="page-subtitle">Manage your products, apply discounts & track stock</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAdd} className="shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4 mr-2" />Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    {editId ? "Edit Product Details" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-sm font-medium">Product Name *</Label>
                    <Input 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                      placeholder="Enter product name"
                      className="mt-1"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={async () => setScannerOpen(true)}>Scan Barcode</Button>
                      {form.barcode && <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/40 rounded">Scanned: {form.barcode}</div>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Brand</Label>
                    <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Brand (auto-filled from scan)" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category *</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Price (₹) *</Label>
                      <Input 
                        type="number" 
                        value={form.price} 
                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Quantity *</Label>
                      <Input 
                        type="number" 
                        value={form.quantity} 
                        onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Expiry Date *</Label>
                    <Input 
                      type="date" 
                      value={form.expiry_date} 
                      onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Batch Details</Label>
                    <Textarea 
                      value={form.batch_details} 
                      onChange={e => setForm(f => ({ ...f, batch_details: e.target.value }))}
                      placeholder="Add batch number, supplier info, or notes..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <Button 
                    onClick={handleSave} 
                    className="w-full" 
                    disabled={addProduct.isPending || updateProduct.isPending}
                  >
                    {editId ? "Update Product" : "Add Product"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Barcode Scanner Dialog */}
            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Scan Barcode</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="text-sm text-muted-foreground">This uses your device camera to scan a product barcode and auto-fill product details (OpenFoodFacts lookup).</div>
                  <div>
                    <div id="barcode-video-container" className="w-full bg-black/10 rounded h-56 flex items-center justify-center">
                      <video id="barcode-video" className="w-full h-full object-cover" />
                    </div>
                    {scanError && <div className="text-sm text-destructive mt-2">{scanError}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={async () => {
                      setScanError(null);
                      setScanning(true);
                      try {
                        const ZXing = await import('@zxing/browser');
                        const codeReader = new ZXing.BrowserMultiFormatContinuousReader();
                        const videoElem = document.getElementById('barcode-video') as HTMLVideoElement;
                        const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();
                        const deviceId = devices && devices.length ? devices[0].deviceId : undefined;
                        codeReader.decodeFromVideoDevice(deviceId, videoElem, (result, err) => {
                          if (result) {
                            const code = result.getText();
                            codeReader.reset();
                            setScanning(false);
                            setScannerOpen(false);
                            handleBarcodeLookup(code);
                          }
                        });
                        // store instance for cleanup
                        (window as any)._codeReader = codeReader;
                      } catch (err: any) {
                        setScanning(false);
                        setScanError('Scanner initialization failed. Run `npm install @zxing/browser` and allow camera access.');
                      }
                    }}>{scanning ? 'Scanning...' : 'Start Scanning'}</Button>
                    <Button variant="outline" onClick={() => {
                      // cleanup
                      try { (window as any)._codeReader?.reset(); } catch (e) {}
                      setScannerOpen(false);
                    }}>Close</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 bg-background/80 backdrop-blur" 
              placeholder="Search products by name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-background/80 backdrop-blur">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDiscount} onValueChange={setFilterDiscount}>
            <SelectTrigger className="w-full sm:w-48 bg-background/80 backdrop-blur">
              <Percent className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="active">With Active Discount</SelectItem>
              <SelectItem value="inactive">Without Active Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Discount Dialog */}
        <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Apply Discount
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-medium">Discount Type</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={discountForm.discount_type === "percentage" ? "default" : "outline"}
                    onClick={() => setDiscountForm(f => ({ ...f, discount_type: "percentage" }))}
                    className="flex-1"
                  >
                    <Percent className="h-4 w-4 mr-2" />
                    Percentage
                  </Button>
                  <Button
                    variant={discountForm.discount_type === "fixed" ? "default" : "outline"}
                    onClick={() => setDiscountForm(f => ({ ...f, discount_type: "fixed" }))}
                    className="flex-1"
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Fixed Amount
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {discountForm.discount_type === "percentage" ? "Discount Percentage" : "Discount Amount (₹)"}
                </Label>
                <Input 
                  type="number"
                  value={discountForm.discount_value}
                  onChange={e => setDiscountForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={discountForm.discount_type === "percentage" ? "10" : "20"}
                  className="mt-1"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Input 
                    type="date" 
                    value={discountForm.discount_start_date}
                    onChange={e => setDiscountForm(f => ({ ...f, discount_start_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <Input 
                    type="date" 
                    value={discountForm.discount_end_date}
                    onChange={e => setDiscountForm(f => ({ ...f, discount_end_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={applyDiscount} className="w-full bg-amber-500 hover:bg-amber-600">
                <Tag className="h-4 w-4 mr-2" />
                Apply Discount
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed border-border animate-in fade-in zoom-in duration-300">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No products found</h3>
            <p className="mt-2 mb-6 text-muted-foreground max-w-sm">
              Get started by adding your first product to manage your inventory effectively!
            </p>
            <Button onClick={openAdd} size="lg" className="rounded-full shadow-sm">
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product: any, idx: number) => {
              const groupStatus = getGroupExpiryStatus(product.totalQuantity, product.batches);
              const isExpanded = expanded[product.name];
              const hasActiveDiscount = isDiscountActive(product.discount_start_date, product.discount_end_date);
              const finalPrice = calculateFinalPrice(product.price, product.discount_type, product.discount_value);

              return (
                <div key={product.name} className={cn("glass p-4 rounded-xl shadow-md relative overflow-hidden transition-transform hover:scale-[1.01]", hasActiveDiscount && "ring-amber-400/20 ring-1")}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{product.name}</h3>
                          {hasActiveDiscount && <Badge className="bg-amber-500 text-white text-[11px]">DISCOUNT ACTIVE</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm", hasActiveDiscount && "line-through text-muted-foreground")}>
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </div>
                      <div className="text-2xl font-bold mt-1 text-green-500">₹{finalPrice.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className={cn("px-2 py-1 rounded-md text-sm font-semibold", product.totalQuantity === 0 ? "bg-red-100 text-red-700" : product.totalQuantity <= 10 ? "bg-amber-100 text-amber-700" : "bg-green-50 text-green-700")}>{product.totalQuantity} in stock</span>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {groupStatus === 'expired' ? (<span className="text-destructive font-medium">Expired</span>) : groupStatus === 'critical' ? (<span className="text-rose-600 font-medium">Expires within 7 days</span>) : groupStatus === 'warning' ? (<span className="text-amber-600 font-medium">Expires within 30 days</span>) : (<span>Expiry: {formatDate(product.batches[0]?.expiry_date || '')}</span>)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(product.batches[0])}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-500" onClick={() => openDiscountDialog(product.batches[0]?.id, product.batches[0])}>
                            <Percent className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Apply Discount</TooltipContent>
                      </Tooltip>

                      {hasActiveDiscount && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeDiscount(product.batches[0]?.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove Discount</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteGroup(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Product</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="mt-4"
                      >
                        <div className="rounded-md border bg-background overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow>
                                <TableHead className="py-2 text-xs font-medium">Batch No.</TableHead>
                                <TableHead className="py-2 text-xs font-medium">Quantity</TableHead>
                                <TableHead className="py-2 text-xs font-medium">Price</TableHead>
                                <TableHead className="py-2 text-xs font-medium">Expiry Date</TableHead>
                                <TableHead className="py-2 text-xs font-medium">Status</TableHead>
                                <TableHead className="py-2 text-xs font-medium text-right">Quick Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {product.batches.map((batch: any, batchIdx: number) => {
                                const bStatus = getExpiryStatus(batch.expiry_date);
                                const batchDiscount = productsWithDiscounts[batch.id];
                                const hasBatchActiveDiscount = isDiscountActive(batchDiscount?.discount_start_date, batchDiscount?.discount_end_date);
                                const batchFinalPrice = calculateFinalPrice(batch.price, batchDiscount?.discount_type, batchDiscount?.discount_value);

                                return (
                                  <TableRow key={batch.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">#{batch.id.slice(0,8)}</TableCell>
                                    <TableCell className="py-2 font-medium">{batch.quantity}{batch.quantity===0 && <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">Depleted</Badge>}</TableCell>
                                    <TableCell className="py-2">
                                      <div className="flex flex-col">
                                        <span className={cn("text-sm", hasBatchActiveDiscount && "line-through text-muted-foreground")}>₹{Number(batch.price).toLocaleString('en-IN')}</span>
                                        {hasBatchActiveDiscount && (<span className="text-xs font-bold text-green-600">₹{batchFinalPrice.toLocaleString('en-IN')}</span>)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2"><div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" />{batch.expiry_date}{bStatus==='expired' && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-5">Expired</Badge>}</div></TableCell>
                                    <TableCell className="py-2">{hasBatchActiveDiscount ? <Badge className="bg-amber-500 text-white text-[9px]"><Tag className="h-3 w-3 mr-1" />Active</Badge> : bStatus==='expired' ? <Badge variant="destructive" className="text-[9px]">Expired</Badge> : bStatus==='critical' ? <Badge className="bg-rose-500 text-white text-[9px]">Critical</Badge> : <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">Active</Badge>}</TableCell>
                                    <TableCell className="py-2 text-right">
                                      <div className="flex justify-end gap-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(batch)}>
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50" onClick={() => openDiscountDialog(batch.id, batch)}>
                                              <Percent className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Apply Discount</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-red-50" onClick={() => handleDelete(batch.id)}>
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Delete</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                  <p className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.quantity, 0)}</p>
                </div>
                <Layers className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Discounts</p>
                  <p className="text-2xl font-bold">
                    {Object.values(productsWithDiscounts).filter(p => 
                      isDiscountActive(p.discount_start_date, p.discount_end_date)
                    ).length}
                  </p>
                </div>
                <Percent className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => getExpiryStatus(p.expiry_date) === "critical").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
