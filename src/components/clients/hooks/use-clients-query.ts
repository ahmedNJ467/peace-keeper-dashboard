
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  type: "organization" | "individual";
  description?: string;
  website?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  is_archived?: boolean;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  created_at?: string;
  updated_at?: string;
  has_active_contract?: boolean;
}

export function useClientsQuery() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Get clients with active contracts using the status field
      const { data: activeContractData, error: contractError } = await supabase
        .from('trips')
        .select('client_id')
        .eq('status', 'in_progress') // Use status column directly
        .is('invoice_id', null); // Not invoiced yet
      
      if (contractError) {
        console.error("Error fetching active contracts:", contractError);
      }
      
      // Get unique client IDs with active contracts
      const clientsWithActiveContracts = new Set(
        activeContractData?.map(trip => trip.client_id) || []
      );
      
      // Add has_active_contract flag to clients
      const clientsWithFlag = (data || []).map(client => ({
        ...client,
        has_active_contract: clientsWithActiveContracts.has(client.id)
      }));
      
      return clientsWithFlag as Client[];
    },
  });
}
