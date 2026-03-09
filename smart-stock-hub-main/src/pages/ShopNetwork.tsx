import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MapPin, Package, Phone, CalendarDays, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketplaceListings } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function ShopNetwork() {
  const { data: listings = [], isLoading } = useMarketplaceListings();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading marketplace...</div>;

  // Filter out the current user's own products (optional, but makes sense for a B2B network) 
  // actually, let's keep all and maybe badge their own, but user requested 'list products they want to sell to other shops'
  // Let's just show all for simplicity, and filter by search.
  const filteredListings = listings.filter((l: any) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Shop Network Marketplace</h1>
          <p className="page-subtitle">Buy and sell products with other local shopkeepers.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, categories or shops..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No products found in the marketplace.
          </div>
        ) : (
          filteredListings.map((listing: any) => {
            const isSoldOut = listing.quantity === 0;
            const isOwn = listing.user_id === user?.id;

            return (
              <Card key={listing.id} className={`flex flex - col overflow - hidden transition - all ${isSoldOut ? "opacity-75 grayscale-[0.3]" : "hover:shadow-md border-primary/20"} `}>
                <CardHeader className="pb-3 bg-muted/20 border-b relative">
                  {isOwn && (
                    <Badge variant="outline" className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20">
                      Your Listing
                    </Badge>
                  )}
                  {isSoldOut ? (
                    <Badge variant="destructive" className="absolute top-4 right-4 uppercase font-bold tracking-wider">
                      Sold Out
                    </Badge>
                  ) : null}
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                    <Package className="h-3.5 w-3.5" />
                    {listing.category}
                  </div>
                  <CardTitle className={`text - xl font - bold flex items - center justify - between ${isSoldOut ? "text-muted-foreground line-through decoration-1" : ""} `}>
                    {listing.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-4 flex flex-col">
                  <div className="flex items-end justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className={`text - 2xl font - bold font - display ${isSoldOut ? "text-muted-foreground" : "text-primary"} `}>₹{listing.price}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">Available Qty</p>
                      <p className={`text - lg font - semibold ${isSoldOut ? "text-destructive" : ""} `}>{listing.quantity}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm flex-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>Expires: <span className="font-medium text-foreground">{listing.expiry_date}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground pt-3 border-t">
                      <Store className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-foreground">{listing.shop_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0 text-success" />
                      <span className="font-medium text-foreground">{listing.contact_phone}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6"
                    variant={isSoldOut ? "secondary" : "default"}
                    disabled={isSoldOut || isOwn}
                    onClick={() => {
                      if (!isSoldOut && !isOwn) {
                        window.location.href = `tel:${listing.contact_phone} `;
                      }
                    }}
                  >
                    {isSoldOut ? "Not Available" : isOwn ? "Manage in Inventory" : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Seller
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
