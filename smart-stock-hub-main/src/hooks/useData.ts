import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export function useProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .gt("quantity", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (product: Omit<ProductInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useSales() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sales", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", user!.id)
        .order("sale_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddSale() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productName, quantityToSell, total }: { productName: string, quantityToSell: number, total: number }) => {
      // 1. Fetch available batches ordered by expiry date (FIFO)
      const { data: batches, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("name", productName)
        .eq("user_id", user!.id)
        .gt("quantity", 0)
        .order("expiry_date", { ascending: true });

      if (fetchError) throw fetchError;

      let remaining = quantityToSell;

      // 2. Reduce stock FIFO
      for (const batch of (batches || [])) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: batch.quantity - deduct })
          .eq("id", batch.id);

        if (updateError) throw updateError;
        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error(`Not enough stock. Missing ${remaining} items for ${productName}`);
      }

      // 3. Insert sale record
      const { error: insertError } = await supabase
        .from("sales")
        .insert({
          user_id: user!.id,
          product_name: productName,
          quantity: quantityToSell,
          total: total,
          sale_date: new Date().toISOString().split("T")[0]
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
    }
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMarketplaceListings() {
  return useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async () => {
      // 1. Fetch all products globally
      const { data: allProducts, error: pError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (pError) throw pError;

      // 2. Fetch all profiles globally to get shop names and phone numbers
      const { data: allProfiles, error: prError } = await supabase
        .from("profiles")
        .select("*");

      if (prError) throw prError;

      // 3. Map profiles by user_id
      const profileMap = new Map();
      (allProfiles || []).forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // 4. Combine product data with seller shop data
      return (allProducts || []).map(p => {
        const sellerProfile = profileMap.get(p.user_id);
        return {
          ...p,
          shop_name: sellerProfile?.shop_name || "Unknown Shop",
          contact_phone: sellerProfile?.phone || "No contact provided",
          owner_name: sellerProfile?.owner_name || ""
        };
      });
    }
  });
}
