
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";

// Delete trip function for the DeleteTripDialog component
export const deleteTripFromDatabase = async (tripId: string) => {
  try {
    // Delete related records first to avoid orphaned data
    await supabase.from("trip_messages").delete().eq("trip_id", tripId);
    await supabase.from("trip_assignments").delete().eq("trip_id", tripId);
    
    // Then delete the trip
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error in deleteTripFromDatabase:", error);
    throw error;
  }
};

// Delete trip
export const deleteTrip = async (
  tripToDelete: string | null,
  viewTrip: DisplayTrip | null,
  editTrip: DisplayTrip | null,
  setViewTrip: (trip: DisplayTrip | null) => void,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setDeleteDialogOpen: (open: boolean) => void,
  setTripToDelete: (id: string | null) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  if (!tripToDelete) return;
  
  // First, reset state to avoid UI freezing
  // It's important to close dialogs and clean up UI state early
  setDeleteDialogOpen(false);

  try {
    // Use the dedicated function for deletion to ensure consistency
    await deleteTripFromDatabase(tripToDelete);

    // Notify user of success
    toast({
      title: "Trip deleted",
      description: "Trip has been deleted successfully",
    });

    // Close any open dialogs if they were showing the deleted trip
    if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
    if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);

    // Update the data
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    
    // Reset delete state last
    setTripToDelete(null);
  } catch (error) {
    console.error("Error deleting trip:", error);
    toast({
      title: "Error",
      description: "Failed to delete trip",
      variant: "destructive",
    });
  }
};
