
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  type: "individual" | "organization";
  email?: string;
  phone?: string;
  address?: string;
  contact?: string;
  description?: string;
  website?: string;
  is_archived?: boolean;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
  has_active_contract?: boolean;
}

export const useClientsQuery = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      return data as Client[];
    },
  });
};

export const useClientByIdQuery = (clientId: string | null) => {
  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          client_contacts(*)
        `)
        .eq("id", clientId)
        .single();
      
      if (error) throw error;
      
      // Use a type assertion to avoid deep instantiation
      return data as {
        id: string;
        name: string;
        type: "individual" | "organization";
        email?: string;
        phone?: string;
        address?: string;
        contact?: string;
        description?: string;
        website?: string;
        is_archived?: boolean;
        profile_image_url?: string;
        created_at?: string;
        updated_at?: string;
        client_contacts?: any[];
      };
    },
    enabled: !!clientId,
  });
};
