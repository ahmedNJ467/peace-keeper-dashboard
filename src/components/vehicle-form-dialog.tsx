
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { VehicleTypeField } from "./vehicle-form/vehicle-type-field";
import { VehicleBasicInfoFields } from "./vehicle-form/vehicle-basic-info-fields";
import { VehicleDetailsFields } from "./vehicle-form/vehicle-details-fields";
import { VehicleStatusField } from "./vehicle-form/vehicle-status-field";
import { VehicleNotesField } from "./vehicle-form/vehicle-notes-field";
import { VehicleImagesField } from "./vehicle-form/vehicle-images-field";
import { useVehicleImages } from "./vehicle-form/use-vehicle-images";
import { ApiError, useApiErrorHandler } from "@/lib/api-error-handler";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
}

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const { toast } = useToast();
  const { handleError } = useApiErrorHandler();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    images, 
    setImages, 
    imagePreviewUrls, 
    setImagePreviewUrls, 
    uploadVehicleImages 
  } = useVehicleImages();

  // For development, we'll set authentication to always be authenticated
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('authenticated');
  
  useEffect(() => {
    const checkAuth = async () => {
      // For development, we'll just set authenticated status
      // In production, uncomment the code below
      /*
      const { data } = await supabase.auth.getSession();
      setAuthStatus(data.session ? 'authenticated' : 'unauthenticated');
      */
      setAuthStatus('authenticated');
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // For development, we'll just set authenticated status
      // In production, uncomment the code below
      // setAuthStatus(session ? 'authenticated' : 'unauthenticated');
      setAuthStatus('authenticated');
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const form = useForm<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>({
    defaultValues: {
      type: 'soft_skin',
      make: '',
      model: '',
      registration: '',
      status: 'active',
      year: undefined,
      color: '',
      vin: '',
      insurance_expiry: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        registration: vehicle.registration,
        status: vehicle.status,
        year: vehicle.year,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        insurance_expiry: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : undefined,
        notes: vehicle.notes || '',
      });
    } else {
      form.reset({
        type: 'soft_skin',
        make: '',
        model: '',
        registration: '',
        status: 'active',
        year: undefined,
        color: '',
        vin: '',
        insurance_expiry: undefined,
        notes: '',
      });
    }
  }, [vehicle, form]);

  async function onSubmit(data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // For development, skip authentication check
      // In production, uncomment the code below
      /*
      if (authStatus !== 'authenticated') {
        throw new ApiError("You must be logged in to perform this action", 401);
      }
      */
      
      setIsSubmitting(true);
      
      const formattedData = {
        ...data,
        year: data.year ? Number(data.year) : null,
        insurance_expiry: data.insurance_expiry || null,
        registration: data.registration.trim().toUpperCase(),
      };

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(formattedData)
          .eq('id', vehicle.id);

        if (error) {
          console.error("Update vehicle error:", error);
          throw error;
        }
        
        await uploadVehicleImages(vehicle.id);
      } else {
        try {
          const { data: existingVehicle, error: checkError } = await supabase
            .from('vehicles')
            .select('id')
            .eq('registration', formattedData.registration)
            .maybeSingle();
          
          if (checkError) {
            console.error("Check existing vehicle error:", checkError);
            throw checkError;
          }
          
          if (existingVehicle) {
            throw new ApiError(`A vehicle with registration ${formattedData.registration} already exists`, 409);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            throw error;
          }
          console.warn("Error checking existing vehicle:", error);
        }
        
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert(formattedData)
          .select()
          .single();

        if (error) {
          console.error("Insert vehicle error:", error);
          throw error;
        }
        
        if (newVehicle) {
          await uploadVehicleImages(newVehicle.id);
        }
      }

      toast({
        title: "Success",
        description: `Vehicle ${vehicle ? 'updated' : 'added'} successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      handleError(error, error instanceof ApiError ? error.message : "Failed to save vehicle. Please check if a vehicle with the same registration already exists.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {vehicle ? 'Update the details of your vehicle below.' : 'Fill in the details of your new vehicle below.'}
          </DialogDescription>
        </DialogHeader>

        {/* Disable the authentication warning in development */}
        {false && authStatus === 'unauthenticated' && (
          <div className="p-4 mb-4 border rounded-md bg-destructive/10 text-destructive">
            <p className="font-medium">Authentication required</p>
            <p className="text-sm">You need to be logged in to add or edit vehicles.</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <VehicleImagesField
              vehicle={vehicle}
              images={images}
              setImages={setImages}
              imagePreviewUrls={imagePreviewUrls}
              setImagePreviewUrls={setImagePreviewUrls}
            />

            <VehicleTypeField form={form} />
            <VehicleBasicInfoFields form={form} />
            <VehicleDetailsFields form={form} />
            <VehicleStatusField form={form} />
            <VehicleNotesField form={form} />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (false && authStatus === 'unauthenticated')}
              >
                {isSubmitting ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
