
import { Driver } from "@/lib/types";
import { DisplayTrip } from "@/lib/types/trip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/string-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, UserCheck } from "lucide-react";
import { Vehicle } from "@/lib/types/vehicle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DriverStatusProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: DisplayTrip[];
}

export function DriverStatus({ drivers, vehicles, trips }: DriverStatusProps) {
  // Ensure we have arrays to work with
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTrips = Array.isArray(trips) ? trips : [];
  
  // Determine which drivers are assigned to trips today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrips = safeTrips.filter(trip => {
    if (!trip || !trip.date) return false;
    
    try {
      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    } catch (error) {
      console.error("Invalid date format:", trip.date);
      return false;
    }
  });
  
  // Get assigned driver IDs and their trip counts
  const assignedDrivers = new Map<string, number>();
  todayTrips.forEach(trip => {
    if (trip.driver_id) {
      const count = assignedDrivers.get(trip.driver_id) || 0;
      assignedDrivers.set(trip.driver_id, count + 1);
    }
  });

  // Get assigned vehicle IDs and their trip counts
  const assignedVehicles = new Map<string, number>();
  todayTrips.forEach(trip => {
    if (trip.vehicle_id) {
      const count = assignedVehicles.get(trip.vehicle_id) || 0;
      assignedVehicles.set(trip.vehicle_id, count + 1);
    }
  });

  // Safe way to get initials
  const safeGetInitials = (name: string | null | undefined): string => {
    if (!name) return '';
    try {
      return getInitials(name);
    } catch (error) {
      console.error("Error getting initials:", error);
      return '';
    }
  };

  return (
    <Tabs defaultValue="drivers" className="w-full">
      <TabsList className="w-full mb-4 bg-slate-800 border border-slate-700">
        <TabsTrigger value="drivers" className="flex-1 data-[state=active]:bg-slate-700">
          <UserCheck className="h-4 w-4 mr-2" />
          Drivers
        </TabsTrigger>
        <TabsTrigger value="vehicles" className="flex-1 data-[state=active]:bg-slate-700">
          <Car className="h-4 w-4 mr-2" />
          Vehicles
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="drivers">
        {!safeDrivers.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No drivers available
          </div>
        ) : (
          <div className="space-y-4">
            {safeDrivers.map(driver => {
              if (!driver || !driver.id) return null;
              
              const tripCount = assignedDrivers.get(driver.id) || 0;
              const isAvailable = tripCount === 0;
              
              return (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 border-b border-slate-800 last:border-b-0 pb-3 last:pb-0 pt-2 first:pt-0"
                >
                  <Avatar>
                    <AvatarImage src={driver.avatar_url || undefined} />
                    <AvatarFallback>{safeGetInitials(driver.name)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="font-medium">{driver.name || "Unnamed Driver"}</div>
                    <div className="text-sm text-muted-foreground">{driver.contact || "No contact"}</div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      className={`${
                        isAvailable 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    >
                      {isAvailable ? "Available" : "Assigned"}
                    </Badge>
                    
                    {tripCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {tripCount} trip{tripCount !== 1 ? "s" : ""} today
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="vehicles">
        {!safeVehicles.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No vehicles available
          </div>
        ) : (
          <div className="space-y-4">
            {safeVehicles.map(vehicle => {
              if (!vehicle || !vehicle.id) return null;
              
              const tripCount = assignedVehicles.get(vehicle.id) || 0;
              const isAvailable = tripCount === 0;
              
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 border-b border-slate-800 last:border-b-0 pb-3 last:pb-0 pt-2 first:pt-0"
                >
                  <div className="bg-slate-700 h-10 w-10 rounded-full flex items-center justify-center">
                    <Car className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">
                      {(vehicle.make || "") + " " + (vehicle.model || "").trim() || "Unknown Vehicle"}
                    </div>
                    <div className="text-sm text-muted-foreground">{vehicle.registration || "No registration"}</div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      className={`${
                        isAvailable 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    >
                      {isAvailable ? "Available" : "Assigned"}
                    </Badge>
                    
                    {tripCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {tripCount} trip{tripCount !== 1 ? "s" : ""} today
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
