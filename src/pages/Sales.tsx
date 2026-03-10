import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Plus } from "lucide-react";
import { useSales, useProducts, useAddSale } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Sales() {
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const addSale = useAddSale();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ productName: "", quantity: "", total: "" });

  const groupedProducts = products.reduce((acc, p) => {
    if (!acc[p.name]) {
      acc[p.name] = { name: p.name, price: p.price, totalQuantity: 0 };
    }
    acc[p.name].totalQuantity += p.quantity;
    return acc;
  }, {} as Record<string, any>);

  const productList = Object.values(groupedProducts);

  const handleProductChange = (name: string) => {
    const p = groupedProducts[name];
    if (p && form.quantity) {
      setForm(f => ({ ...f, productName: name, total: String(p.price * Number(f.quantity)) }));
    } else {
      setForm(f => ({ ...f, productName: name }));
    }
  };

  const handleQuantityChange = (qty: string) => {
    const p = groupedProducts[form.productName];
    if (p && qty) {
      setForm(f => ({ ...f, quantity: qty, total: String(p.price * Number(qty)) }));
    } else {
      setForm(f => ({ ...f, quantity: qty }));
    }
  };

  async function handleRecordSale() {
    if (!form.productName || !form.quantity || !form.total) {
      toast.error("Please fill in all fields");
      return;
    }
    const qty = Number(form.quantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    const p = groupedProducts[form.productName];
    if (!p || p.totalQuantity < qty) {
      toast.error(`Not enough stock. Only ${p ? p.totalQuantity : 0} available.`);
      return;
    }

    try {
      await addSale.mutateAsync({
        productName: form.productName,
        quantityToSell: qty,
        total: Number(form.total)
      });
      toast.success("Sale recorded successfully!");
      setDialogOpen(false);
      setForm({ productName: "", quantity: "", total: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const totalItems = sales.reduce((s, sale) => s + sale.quantity, 0);

  if (loadingSales || loadingProducts) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading sales...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Sales Tracking</h1>
          <p className="page-subtitle">Track your daily sales and revenue</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={form.productName} onValueChange={handleProductChange}>
                  <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                  <SelectContent>
                    {productList.map(p => (
                      <SelectItem key={p.name} value={p.name} disabled={p.totalQuantity === 0}>
                        {p.name} {p.totalQuantity === 0 ? "(Out of stock)" : `(${p.totalQuantity} in stock)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity to Sell</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => handleQuantityChange(e.target.value)}
                    placeholder="E.g., 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Price (₹)</Label>
                  <Input
                    type="number"
                    value={form.total}
                    onChange={e => setForm(f => ({ ...f, total: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleRecordSale} className="w-full mt-4" disabled={addSale.isPending}>
                Complete Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-3xl font-bold font-display mt-1">{sales.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Items Sold</p>
          <p className="text-3xl font-bold font-display mt-1">{totalItems}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold font-display mt-1 text-primary">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Sales History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No sales recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.product_name}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">₹{Number(sale.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(sale.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
