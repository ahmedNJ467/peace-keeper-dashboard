
import { DisplayTrip } from "@/lib/types/trip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DriverPerformanceProps {
  trips: DisplayTrip[];
}

export function DriverPerformance({ trips }: DriverPerformanceProps) {
  // Count trips by driver
  const driverTripCounts: Record<string, { trips: number, revenue: number, name: string }> = {};
  
  trips.forEach(trip => {
    const driverId = trip.driver_id;
    const driverName = trip.driver_name || 'Unknown Driver';
    
    if (!driverTripCounts[driverId]) {
      driverTripCounts[driverId] = { trips: 0, revenue: 0, name: driverName };
    }
    
    driverTripCounts[driverId].trips += 1;
    driverTripCounts[driverId].revenue += (trip.amount || 0);
  });
  
  // Convert to array and sort by trip count
  const driverData = Object.entries(driverTripCounts)
    .map(([id, data]) => ({
      id,
      name: data.name,
      trips: data.trips,
      revenue: data.revenue
    }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 10); // Top 10 drivers

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Drivers by Trip Count</CardTitle>
          <CardDescription>Number of trips completed by each driver</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {driverData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={driverData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 100,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" fill="#8884d8" name="Trip Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No driver performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Drivers by Revenue</CardTitle>
          <CardDescription>Total revenue generated by each driver</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {driverData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={driverData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 100,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No driver revenue data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
