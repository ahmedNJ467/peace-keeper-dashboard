import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FuelLog } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fuelLogSchema, FuelLogFormValues } from "./schemas/fuel-log-schema";
import {
  getVehicles,
  getLatestMileage,
  saveFuelLog,
  getFuelLogById,
} from "./services/fuel-log-service";
import { useFuelCalculations } from "./hooks/use-fuel-calculations";

export { fuelLogSchema, type FuelLogFormValues };

export function useFuelLogForm(fuelLog?: FuelLog) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldCloseDialog, setShouldCloseDialog] = useState(false);

  // Fetch vehicles for select dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  // Initialize form with default values or existing fuel log data
  const form = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: fuelLog
      ? {
          vehicle_id: fuelLog.vehicle_id,
          date: fuelLog.date,
          fuel_type: fuelLog.fuel_type,
          volume: fuelLog.volume,
          price_per_liter:
            fuelLog.volume > 0 ? fuelLog.cost / fuelLog.volume : 0,
          cost: fuelLog.cost,
          previous_mileage: fuelLog.previous_mileage || 0,
          current_mileage: fuelLog.current_mileage || 0,
          mileage: fuelLog.mileage || 0,
          notes: fuelLog.notes || "",
          filled_by: fuelLog.filled_by || "",
        }
      : {
          vehicle_id: "",
          date: new Date().toISOString().split("T")[0],
          fuel_type: "diesel",
          volume: 0,
          price_per_liter: 0,
          cost: 0,
          previous_mileage: 0,
          current_mileage: 0,
          mileage: 0,
          notes: "",
          filled_by: "",
        },
  });

  // Apply calculations for cost and mileage
  useFuelCalculations(form);

  const vehicleId = form.watch("vehicle_id");

  // Load previous mileage when vehicle changes
  useEffect(() => {
    if (!vehicleId) return;

    const fetchMileage = async () => {
      try {
        console.log("Vehicle ID changed to:", vehicleId);

        // If editing existing fuel log, don't override the previous mileage
        if (fuelLog && fuelLog.vehicle_id === vehicleId) {
          console.log(
            "Editing existing fuel log, keeping previous mileage:",
            fuelLog.previous_mileage
          );
          return;
        }

        // Otherwise, get the latest mileage for this vehicle
        console.log("Fetching latest mileage for vehicle:", vehicleId);
        const lastMileage = await getLatestMileage(vehicleId);
        console.log("Fetched last mileage:", lastMileage);

        // Set previous mileage to the last recorded mileage
        form.setValue("previous_mileage", lastMileage);

        // Clear current mileage so user can fill it in with new value
        if (!fuelLog) {
          form.setValue("current_mileage", 0);
        }
      } catch (error) {
        console.error("Error fetching latest mileage:", error);
      }
    };

    fetchMileage();
  }, [vehicleId, form, fuelLog]);

  // Handle form submission
  const handleSubmit = async (values: FuelLogFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      const result = await saveFuelLog(values, fuelLog?.id);

      // Invalidate and refetch the query to ensure the UI updates
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });

      toast({
        title: result.isNewRecord ? "Fuel log created" : "Fuel log updated",
        description: result.isNewRecord
          ? "A new fuel log has been created successfully."
          : "The fuel log has been updated successfully.",
      });

      form.reset();
      setShouldCloseDialog(true);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save fuel log",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    vehicles,
    isSubmitting,
    handleSubmit,
    shouldCloseDialog,
    resetCloseDialog: () => setShouldCloseDialog(false),
  };
}
