import React, { useState } from "react";
import { User, Phone, Mail, MapPin, Home, Settings, ShieldCheck, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useSales, useProfile, useUpsertProfile } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import CountUp from "react-countup";

export default function Profile() {
  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const upsert = useUpsertProfile();
  const { signOut } = useAuth();

  useEffect(() => {
    if (profile) {
      setName(profile.owner_name ?? "Shopkeeper");
      setPhone(profile.phone ?? "");
      setShopName(profile.shop_name ?? "");
      setCity(profile.address ?? "");
    }
  }, [profile]);

  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + Number(p.quantity || 0), 0);
  const nearExpiry = products.filter(p => {
    const diff = Math.ceil((new Date(p.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;

  const [name, setName] = useState("Shopkeeper");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Grocery Store");
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account, shop details and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Shopkeeper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 bg-muted">
                  <User className="h-10 w-10" />
                </Avatar>
                <div className="w-full space-y-3">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@store.com" />
                  <Button className="w-full mt-2" onClick={() => upsert.mutate({ owner_name: name, phone, shop_name: shopName, address: city })}>
                    {upsert.isLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">Products</div>
                  <div className="text-2xl font-bold"><CountUp end={totalProducts} duration={1.5} /></div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">Total Stock</div>
                  <div className="text-2xl font-bold"><CountUp end={totalStock} duration={1.5} /></div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">Near Expiry</div>
                  <div className="text-2xl font-bold"><CountUp end={nearExpiry} duration={1.5} /></div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">Out of Stock</div>
                  <div className="text-2xl font-bold"><CountUp end={outOfStock} duration={1.5} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="account" className="space-y-4">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Shopkeeper Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Full name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Role</label>
                    <Input value={"Shopkeeper"} disabled />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Shop Name</label>
                    <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City / Location</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Category</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={category} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Medical Store">Medical Store</SelectItem>
                        <SelectItem value="Grocery Store">Grocery Store</SelectItem>
                        <SelectItem value="General Store">General Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">GST Number (optional)</label>
                    <Input />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Address</label>
                    <Input />
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={() => upsert.mutate({ owner_name: name, phone, shop_name: shopName, address: city })}>
                      {upsert.isLoading ? 'Saving...' : 'Save Shop Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Sales Today</div>
                      <div className="text-xl font-bold">₹<CountUp end={sales.filter(s => new Date(s.sale_date).toDateString() === new Date().toDateString()).reduce((a,b)=>a+Number(b.total),0)} duration={1.5} /></div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Weekly Sales</div>
                      <div className="text-xl font-bold">₹<CountUp end={0} duration={1.5} /></div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                      <div className="text-xl font-bold">₹<CountUp end={sales.reduce((a,b)=>a+Number(b.total),0)} duration={1.5} /></div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Best Selling</div>
                      <div className="text-sm font-medium">{sales.length ? sales[0].product_name : "—"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Expiry Alerts</div>
                      <div className="text-xs text-muted-foreground">Get alerted when products near expiry</div>
                    </div>
                    <Switch checked={expiryAlerts} onCheckedChange={(v) => setExpiryAlerts(Boolean(v))} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Low Stock Alerts</div>
                      <div className="text-xs text-muted-foreground">Notify when stock goes low</div>
                    </div>
                    <Switch checked={lowStockAlerts} onCheckedChange={(v) => setLowStockAlerts(Boolean(v))} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Sales Summary</div>
                      <div className="text-xs text-muted-foreground">Receive periodic sales summaries</div>
                    </div>
                    <Switch checked={salesNotifications} onCheckedChange={(v) => setSalesNotifications(Boolean(v))} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Change Password</label>
                      <Input type="password" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Enable Two-Factor Authentication</label>
                      <Switch />
                    </div>
                  </div>
                  <div>
                    <Button variant="destructive" onClick={() => signOut()}>Log out</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>App Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Dark Mode</div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={(v) => setDarkMode(Boolean(v))} />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Language</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'English' : 'Hindi'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
