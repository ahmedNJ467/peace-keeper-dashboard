
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus, TripType, DbServiceType } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";
import { serviceTypeMap, mapTripTypeToDbServiceType } from "./service-type-mapping";
import { createRecurringTrips } from "./recurring-operations";

// Handle saving a trip (new or edit)
export const handleSaveTrip = async (
  event: React.FormEvent<HTMLFormElement>,
  editTrip: DisplayTrip | null,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setBookingOpen: (open: boolean) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  
  const uiServiceType = formData.get("service_type") as string;
  const tripType: TripType = (serviceTypeMap[uiServiceType] || "other") as TripType;
  const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
  const isRecurringChecked = formData.get("is_recurring") === "on";
  
  // Extract flight details separately - they now go into their own columns
  const flightNumber = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("flight_number") as string 
    : null;
    
  const airline = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("airline") as string 
    : null;
    
  const terminal = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("terminal") as string 
    : null;
  
  // Get notes without adding flight details
  const notes = formData.get("special_notes") as string || "";
  
  // Get status value directly from form for edit mode
  const statusValue = formData.get("status") as TripStatus || "scheduled";
  
  try {
    if (editTrip) {
      // Update existing trip
      const { error } = await supabase
        .from("trips")
        .update({
          client_id: formData.get("client_id") as string,
          vehicle_id: formData.get("vehicle_id") as string,
          driver_id: formData.get("driver_id") as string,
          date: formData.get("date") as string,
          time: formData.get("time") as string,
          return_time: formData.get("return_time") as string || null,
          service_type: dbServiceType,
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: notes || null,
          status: statusValue, // Use the status field directly
          flight_number: flightNumber,
          airline: airline,
          terminal: terminal
        })
        .eq("id", editTrip.id);
      
      if (error) throw error;

      toast({
        title: "Trip updated",
        description: "Trip details have been updated successfully",
      });
      
      setEditTrip(null);
    } else if (isRecurringChecked) {
      // Create recurring trips
      const occurrences = parseInt(formData.get("occurrences") as string) || 1;
      const frequencyValue = formData.get("frequency") as "daily" | "weekly" | "monthly";
      
      const trips = await createRecurringTrips(formData, occurrences, frequencyValue);
      
      // Update the recurring trips with flight details and status
      trips.forEach(trip => {
        trip.flight_number = flightNumber;
        trip.airline = airline; 
        trip.terminal = terminal;
        trip.status = "scheduled";
      });
      
      const { error } = await supabase
        .from("trips")
        .insert(trips);
      
      if (error) throw error;

      toast({
        title: "Recurring trips created",
        description: `${trips.length} trips have been scheduled successfully`,
      });
      
      setBookingOpen(false);
    } else {
      // Create new single trip
      const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(uiServiceType);
      
      const { error } = await supabase
        .from("trips")
        .insert({
          client_id: formData.get("client_id") as string,
          vehicle_id: formData.get("vehicle_id") as string,
          driver_id: formData.get("driver_id") as string,
          date: formData.get("date") as string,
          time: formData.get("time") as string,
          return_time: needsReturnTime ? (formData.get("return_time") as string) : null,
          service_type: dbServiceType,
          amount: 0, // Default amount
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: notes || null,
          status: "scheduled", // Default status
          flight_number: flightNumber,
          airline: airline,
          terminal: terminal
        });
      
      if (error) {
        console.error("Error creating trip:", error);
        throw error;
      }

      toast({
        title: "Trip created",
        description: "New trip has been booked successfully",
      });
      
      setBookingOpen(false);
    }
    
    queryClient.invalidateQueries({ queryKey: ["trips"] });
  } catch (error) {
    console.error("Error saving trip:", error);
    toast({
      title: "Error",
      description: "Failed to save trip details",
      variant: "destructive",
    });
  }
};
