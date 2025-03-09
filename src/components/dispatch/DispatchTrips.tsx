
import { Button } from "@/components/ui/button";
import { DisplayTrip } from "@/lib/types/trip";
import { MapPin, User, MessageCircle, Clock, AlertTriangle } from "lucide-react";
import { formatDate, formatTime } from "@/components/trips/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DispatchTripsProps {
  trips: DisplayTrip[];
  onAssignDriver: (trip: DisplayTrip) => void;
  onSendMessage: (trip: DisplayTrip) => void;
}

export function DispatchTrips({
  trips,
  onAssignDriver,
  onSendMessage
}: DispatchTripsProps) {
  // Ensure we have an array to work with
  const safeTrips = Array.isArray(trips) ? trips.filter(Boolean) : [];
  
  if (safeTrips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trips in this category
      </div>
    );
  }

  // Check for scheduling conflicts where the same driver is assigned to multiple trips at the same time
  const conflictedDrivers = new Map<string, DisplayTrip[]>();
  const conflictedTrips = new Set<string>();

  // Group trips by date - SAFELY
  const tripsByDate = new Map<string, DisplayTrip[]>();
  safeTrips.forEach(trip => {
    if (!trip || !trip.date) return; // Skip trips without dates
    
    const dateKey = trip.date.toString();
    if (!tripsByDate.has(dateKey)) {
      tripsByDate.set(dateKey, []);
    }
    tripsByDate.get(dateKey)?.push(trip);
  });

  // Check for conflicts within each date
  tripsByDate.forEach(dateTrips => {
    // Check each trip against other trips on the same date
    for (let i = 0; i < dateTrips.length; i++) {
      const trip1 = dateTrips[i];
      
      // Skip if no driver assigned or already identified as conflicted
      if (!trip1.driver_id) continue;
      
      for (let j = i + 1; j < dateTrips.length; j++) {
        const trip2 = dateTrips[j];
        
        // Skip if no driver assigned or different drivers
        if (!trip2.driver_id || trip1.driver_id !== trip2.driver_id) continue;
        
        // Check if the times overlap (within 1 hour) - SAFELY
        const time1 = convertTimeToMinutes(trip1.time);
        const time2 = convertTimeToMinutes(trip2.time);
        
        if (Math.abs(time1 - time2) < 60) {
          // Add both trips to the conflicted set if they have valid IDs
          if (trip1.id) conflictedTrips.add(trip1.id);
          if (trip2.id) conflictedTrips.add(trip2.id);
          
          // Group conflicts by driver
          if (trip1.driver_id) {
            if (!conflictedDrivers.has(trip1.driver_id)) {
              conflictedDrivers.set(trip1.driver_id, []);
            }
            
            if (!conflictedDrivers.get(trip1.driver_id)?.some(t => t.id === trip1.id)) {
              conflictedDrivers.get(trip1.driver_id)?.push(trip1);
            }
            
            if (!conflictedDrivers.get(trip1.driver_id)?.some(t => t.id === trip2.id)) {
              conflictedDrivers.get(trip1.driver_id)?.push(trip2);
            }
          }
        }
      }
    }
  });

  // Safe formatters that don't throw errors
  const safeFormatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return "No date";
    try {
      return formatDate(dateStr);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const safeFormatTime = (timeStr: string | undefined | null): string => {
    if (!timeStr) return "No time";
    try {
      return formatTime(timeStr);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Safe ID formatter
  const safeFormatId = (id: string | undefined | null): string => {
    if (!id) return "N/A";
    try {
      return id.substring(0, 8).toUpperCase();
    } catch (error) {
      console.error("Error formatting ID:", error);
      return "Invalid ID";
    }
  };

  return (
    <div className="space-y-4">
      {/* Display a warning if there are conflicts */}
      {conflictedDrivers.size > 0 && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-500/50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3>Scheduling Conflicts Detected</h3>
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-200">
            {Array.from(conflictedDrivers.entries()).map(([driverId, trips]) => {
              const driverName = trips[0]?.driver_name || 'Unknown Driver';
              return (
                <div key={driverId} className="mb-2">
                  <p>
                    <span className="font-medium">{driverName}</span> is assigned to {trips.length} trips at the same time:
                  </p>
                  <ul className="list-disc list-inside pl-2">
                    {trips.map(trip => (
                      <li key={trip.id || "unknown"}>
                        {safeFormatDate(trip.date)} at {safeFormatTime(trip.time)} - {trip.pickup_location || "No pickup"} to {trip.dropoff_location || "No dropoff"}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {safeTrips.map(trip => (
        <div 
          key={trip.id || "trip-" + Math.random().toString(36).substring(2, 9)} 
          className={`border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow ${
            trip.id && conflictedTrips.has(trip.id) ? 'border-amber-500 dark:border-amber-500/70' : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
            <div className="font-medium text-lg">
              {safeFormatDate(trip.date)} 
              {trip.time && (
                <span className="text-muted-foreground ml-2 text-sm">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {safeFormatTime(trip.time)}
                </span>
              )}
              
              {/* Conflict indicator */}
              {trip.id && conflictedTrips.has(trip.id) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Conflict
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>This driver is scheduled for multiple trips at the same time</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Trip ID: {safeFormatId(trip.id)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <div className="flex items-start gap-1 text-sm mb-1">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Pickup</div>
                  <div>{trip.pickup_location || "Not specified"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-1 text-sm">
                <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Dropoff</div>
                  <div>{trip.dropoff_location || "Not specified"}</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm mb-1">
                <span className="font-medium">Client:</span> {trip.client_name || "Not specified"}
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Driver:</span> {trip.driver_id ? trip.driver_name : "Unassigned"}
              </div>
              
              {trip.passengers && trip.passengers.length > 0 && (
                <div className="text-sm mt-1">
                  <span className="font-medium">Passengers:</span> {trip.passengers.length}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => onAssignDriver(trip)}
              className={trip.driver_id ? "bg-blue-500 hover:bg-blue-600" : "bg-primary"}
            >
              <User className="h-4 w-4 mr-1" />
              {trip.driver_id ? "Reassign Driver" : "Assign Driver"}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSendMessage(trip)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Send Message
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to convert time string (HH:MM) to minutes for easier comparison
function convertTimeToMinutes(timeString: string | undefined | null): number {
  if (!timeString) return 0;
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (isNaN(hours) ? 0 : hours * 60) + (isNaN(minutes) ? 0 : minutes);
  } catch (error) {
    console.error("Error converting time to minutes:", timeString, error);
    return 0;
  }
}
