
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
  
  return {
    activeTab,
    setActiveTab,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deletionError,
    handleDelete,
    handleRestore
  };
}
