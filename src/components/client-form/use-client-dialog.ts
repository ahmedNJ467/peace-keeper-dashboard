
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useClientDialog(
  client: any | null, 
  onOpenChange: (open: boolean) => void,
  onClientDeleted?: () => void
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [permanentDeletionError, setPermanentDeletionError] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Function to archive a client
  const handleDelete = useCallback(async () => {
    if (!client) return;
    
    try {
      setDeletionError(null);
      
      // We're not actually deleting the client, just marking it as archived
      const { error } = await supabase
        .from("clients")
        .update({ is_archived: true })
        .eq("id", client.id);
      
      if (error) throw error;
      
      // Close both dialogs
      setShowDeleteConfirm(false);
      onOpenChange(false);
      
      // Show success message
      toast({
        title: "Client archived",
        description: "The client has been moved to the archive.",
      });
      
      // Refresh the client list
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      // Call the deletion callback if provided
      if (onClientDeleted) {
        onClientDeleted();
      }
    } catch (error) {
      console.error("Error archiving client:", error);
      setDeletionError("There was an error archiving this client. Please try again.");
    }
  }, [client, onOpenChange, toast, queryClient, onClientDeleted]);
  
  // Function to restore an archived client
  const handleRestore = useCallback(async () => {
    if (!client) return;
    
    try {
      // Mark the client as not archived
      const { error } = await supabase
        .from("clients")
        .update({ is_archived: false })
        .eq("id", client.id);
      
      if (error) throw error;
      
      // Close the dialog
      onOpenChange(false);
      
      // Show success message
      toast({
        title: "Client restored",
        description: "The client has been restored from the archive.",
      });
      
      // Refresh the client list
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (error) {
      console.error("Error restoring client:", error);
      toast({
        title: "Error",
        description: "There was an error restoring this client. Please try again.",
        variant: "destructive",
      });
    }
  }, [client, onOpenChange, toast, queryClient]);
  
  // Function to permanently delete a client
  const handlePermanentDelete = useCallback(async () => {
    if (!client) return;
    
    try {
      setIsPerformingAction(true);
      setPermanentDeletionError(null);
      
      // Check if there are any trips associated with this client
      const { data: relatedTrips, error: tripsCheckError } = await supabase
        .from("trips")
        .select("id")
        .eq("client_id", client.id);
      
      if (tripsCheckError) throw tripsCheckError;
      
      // If there are related trips, we can't delete the client
      if (relatedTrips && relatedTrips.length > 0) {
        throw new Error(`Cannot delete client because it has ${relatedTrips.length} associated trips. Please delete the trips first or assign them to a different client.`);
      }
      
      // First delete related contacts
      await supabase
        .from("client_contacts")
        .delete()
        .eq("client_id", client.id);
      
      // Then delete related members
      await supabase
        .from("client_members")
        .delete()
        .eq("client_id", client.id);
      
      // Finally delete the client
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);
      
      if (error) throw error;
      
      // Close the dialog
      setShowPermanentDeleteConfirm(false);
      onOpenChange(false);
      
      // Show success message
      toast({
        title: "Client deleted",
        description: "The client has been permanently deleted.",
      });
      
      // Refresh the client list
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      // Call the deletion callback if provided
      if (onClientDeleted) {
        onClientDeleted();
      }
    } catch (error: any) {
      console.error("Error permanently deleting client:", error);
      setPermanentDeletionError(error.message || "There was an error deleting this client. It might be referenced in other records.");
    } finally {
      setIsPerformingAction(false);
    }
  }, [client, onOpenChange, toast, queryClient, onClientDeleted]);
  
  return {
    activeTab,
    setActiveTab,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deletionError,
    handleDelete,
    handleRestore,
    showPermanentDeleteConfirm,
    setShowPermanentDeleteConfirm,
    permanentDeletionError,
    setPermanentDeletionError,
    isPerformingAction,
    setIsPerformingAction,
    handlePermanentDelete
  };
}
