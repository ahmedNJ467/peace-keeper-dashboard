
import { useState, useEffect } from "react";
import { AlertItem } from "./AlertItem";
import { AlertFilters } from "./AlertFilters";
import { useContractAlertsData } from "@/hooks/use-contract-alerts-data";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertsListProps } from "./types";

export const AlertsList = ({ filterPriority }: AlertsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    resolved: false,
    priority: filterPriority || "",
    type: "",
  });

  const { alerts, isLoading, isError, refetch } = useContractAlertsData(filters);

  // Set up real-time listener for alerts table changes
  useEffect(() => {
    // Create a unique channel name to avoid conflicts
    const channelName = 'alerts-list-realtime-' + Math.random().toString(36).substring(7);
    
    const alertsChannel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        console.log('Real-time alert update received:', payload);
        // Invalidate and refetch the alerts query when any change happens
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        
        toast({
          title: "Alerts updated",
          description: "The alerts list has been updated with new data.",
        });
      })
      .subscribe();
    
    console.log('Alerts real-time subscription activated');
    
    return () => {
      console.log('Cleaning up alerts real-time subscription');
      supabase.removeChannel(alertsChannel);
    };
  }, [queryClient, toast]);

  const handleResolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve the alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error resolving alert:", error);
    }
  };

  return (
    <div className="space-y-6">
      <AlertFilters onFilterChange={setFilters} />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load alerts. Please try again.</p>
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onResolve={handleResolveAlert} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No alerts found matching the current filters.</p>
        </div>
      )}
    </div>
  );
};
