
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Download, BarChart3, TrendingUp, Car, Fuel, Wrench, Users, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TabProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const reportTabs: TabProps[] = [
  {
    title: "Vehicles",
    value: "vehicles",
    icon: <Car className="h-4 w-4" />,
  },
  {
    title: "Fuel Consumption",
    value: "fuel",
    icon: <Fuel className="h-4 w-4" />,
  },
  {
    title: "Maintenance",
    value: "maintenance",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    title: "Trips",
    value: "trips",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: "Drivers",
    value: "drivers",
    icon: <Users className="h-4 w-4" />,
  },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [timeRange, setTimeRange] = useState("month");

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, maintenance(cost, date, description)");

      if (error) throw error;
      return data;
    },
  });

  const { data: fuelData, isLoading: isLoadingFuel } = useQuery({
    queryKey: ["fuel-report", timeRange],
    queryFn: async () => {
      let timeFilter = new Date();
      if (timeRange === "month") {
        timeFilter.setMonth(timeFilter.getMonth() - 1);
      } else if (timeRange === "quarter") {
        timeFilter.setMonth(timeFilter.getMonth() - 3);
      } else if (timeRange === "year") {
        timeFilter.setFullYear(timeFilter.getFullYear() - 1);
      }

      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*, vehicles(make, model)")
        .gte("date", timeFilter.toISOString().split("T")[0]);

      if (error) throw error;
      return data;
    },
  });

  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance-report", timeRange],
    queryFn: async () => {
      let timeFilter = new Date();
      if (timeRange === "month") {
        timeFilter.setMonth(timeFilter.getMonth() - 1);
      } else if (timeRange === "quarter") {
        timeFilter.setMonth(timeFilter.getMonth() - 3);
      } else if (timeRange === "year") {
        timeFilter.setFullYear(timeFilter.getFullYear() - 1);
      }

      const { data, error } = await supabase
        .from("maintenance")
        .select("*, vehicles(make, model)")
        .gte("date", timeFilter.toISOString().split("T")[0]);

      if (error) throw error;
      return data;
    },
  });

  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips-report", timeRange],
    queryFn: async () => {
      let timeFilter = new Date();
      if (timeRange === "month") {
        timeFilter.setMonth(timeFilter.getMonth() - 1);
      } else if (timeRange === "quarter") {
        timeFilter.setMonth(timeFilter.getMonth() - 3);
      } else if (timeRange === "year") {
        timeFilter.setFullYear(timeFilter.getFullYear() - 1);
      }

      const { data, error } = await supabase
        .from("trips")
        .select("*, vehicles(make, model), drivers(name), clients(name)")
        .gte("date", timeFilter.toISOString().split("T")[0]);

      if (error) throw error;
      return data;
    },
  });

  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["drivers-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  // Helper function to flatten nested objects for export
  const flattenData = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      const flattened: Record<string, any> = {};
      
      Object.entries(item).forEach(([key, value]) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
            flattened[`${key}_${nestedKey}`] = nestedValue;
          });
        } else {
          flattened[key] = value;
        }
      });
      
      return flattened;
    });
  };

  const exportToPDF = (data: any[], title: string, filename: string) => {
    if (!data || data.length === 0) return;
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    
    // Prepare the data
    const flattenedData = flattenData(data);
    
    // Get headers from first item
    const firstItem = flattenedData[0];
    const headers = Object.keys(firstItem);
    
    // Prepare rows data
    const rows = flattenedData.map(item => 
      headers.map(header => {
        const val = item[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      })
    );
    
    // Custom headers for specific report types
    let tableHeaders: string[] = [];
    
    switch(filename) {
      case 'vehicles-report':
        tableHeaders = ['Make', 'Model', 'Type', 'Registration', 'Status', 'Year'];
        break;
      case 'fuel-report':
        tableHeaders = ['Date', 'Vehicle', 'Volume (L)', 'Type', 'Mileage (km)', 'Cost ($)'];
        break;
      case 'maintenance-report':
        tableHeaders = ['Date', 'Vehicle', 'Description', 'Status', 'Provider', 'Cost ($)'];
        break;
      case 'trips-report':
        tableHeaders = ['Date', 'Vehicle', 'Driver', 'Client', 'Status', 'Amount ($)'];
        break;
      case 'drivers-report':
        tableHeaders = ['Name', 'Contact', 'License Type', 'License No.', 'Expiry', 'Status'];
        break;
      default:
        tableHeaders = headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '));
    }

    // Generate the table
    autoTable(doc, {
      head: [tableHeaders],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 40 },
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
  };

  // Original CSV export function
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    // Flatten nested objects
    const flattenedData = flattenData(data);
    
    // Get all headers
    const headers: string[] = Array.from(
      new Set(
        flattenedData.flatMap(obj => Object.keys(obj))
      )
    );
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row => 
        headers.map(header => {
          const val = row[header] !== undefined ? row[header] : '';
          // Escape values that contain commas, quotes, or newlines
          const escaped = typeof val === 'string' && 
            (val.includes(',') || val.includes('"') || val.includes('\n')) 
              ? `"${val.replace(/"/g, '""')}"` 
              : val;
          return escaped;
        }).join(',')
      )
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVehicleMaintenanceCosts = (vehicleId: string) => {
    if (!vehiclesData) return 0;
    
    const vehicle = vehiclesData.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.maintenance) return 0;
    
    return Array.isArray(vehicle.maintenance)
      ? vehicle.maintenance.reduce((sum, item) => sum + Number(item.cost || 0), 0)
      : 0;
  };

  const calculateTotalFuelCost = () => {
    if (!fuelData) return 0;
    return fuelData.reduce((sum, log) => sum + Number(log.cost || 0), 0);
  };

  const calculateTotalMaintenanceCost = () => {
    if (!maintenanceData) return 0;
    return maintenanceData.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  };

  const calculateTotalTripRevenue = () => {
    if (!tripsData) return 0;
    return tripsData.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fuel Expenses</CardTitle>
            <CardDescription>Total fuel costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoadingFuel ? "..." : calculateTotalFuelCost().toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Maintenance Costs</CardTitle>
            <CardDescription>Total maintenance costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoadingMaintenance ? "..." : calculateTotalMaintenanceCost().toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trip Revenue</CardTitle>
            <CardDescription>Total trip revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoadingTrips ? "..." : calculateTotalTripRevenue().toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
          {reportTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Vehicles Report</CardTitle>
                <CardDescription>Overview of all vehicles and their stats</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToPDF(vehiclesData || [], 'Vehicles Report', 'vehicles-report')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(vehiclesData || [], 'vehicles-report')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead className="text-right">Maintenance Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingVehicles ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : vehiclesData && vehiclesData.length > 0 ? (
                      vehiclesData.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>{vehicle.make} {vehicle.model} ({vehicle.year})</TableCell>
                          <TableCell>{vehicle.status}</TableCell>
                          <TableCell>{vehicle.type}</TableCell>
                          <TableCell>{vehicle.registration}</TableCell>
                          <TableCell className="text-right">${getVehicleMaintenanceCosts(vehicle.id).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Fuel Consumption Report</CardTitle>
                <CardDescription>All fuel expenses for the selected period</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToPDF(fuelData || [], 'Fuel Consumption Report', 'fuel-report')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(fuelData || [], 'fuel-report')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFuel ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : fuelData && fuelData.length > 0 ? (
                      fuelData.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(new Date(log.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {log.vehicles?.make} {log.vehicles?.model}
                          </TableCell>
                          <TableCell>{log.volume} L</TableCell>
                          <TableCell>{log.fuel_type}</TableCell>
                          <TableCell>{log.mileage} km</TableCell>
                          <TableCell className="text-right">${Number(log.cost).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Maintenance Report</CardTitle>
                <CardDescription>All maintenance records for the selected period</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToPDF(maintenanceData || [], 'Maintenance Report', 'maintenance-report')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(maintenanceData || [], 'maintenance-report')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service Provider</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMaintenance ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : maintenanceData && maintenanceData.length > 0 ? (
                      maintenanceData.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {record.vehicles?.make} {record.vehicles?.model}
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>{record.service_provider || 'N/A'}</TableCell>
                          <TableCell className="text-right">${Number(record.cost).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Trips Report</CardTitle>
                <CardDescription>All trips for the selected period</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToPDF(tripsData || [], 'Trips Report', 'trips-report')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(tripsData || [], 'trips-report')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTrips ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : tripsData && tripsData.length > 0 ? (
                      tripsData.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>{format(new Date(trip.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {trip.vehicles?.make} {trip.vehicles?.model}
                          </TableCell>
                          <TableCell>{trip.drivers?.name}</TableCell>
                          <TableCell>{trip.clients?.name}</TableCell>
                          <TableCell>{trip.status}</TableCell>
                          <TableCell className="text-right">${Number(trip.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Drivers Report</CardTitle>
                <CardDescription>Overview of all drivers</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToPDF(driversData || [], 'Drivers Report', 'drivers-report')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(driversData || [], 'drivers-report')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>License Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDrivers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : driversData && driversData.length > 0 ? (
                      driversData.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>{driver.name}</TableCell>
                          <TableCell>{driver.contact || 'N/A'}</TableCell>
                          <TableCell>{driver.license_type || 'N/A'}</TableCell>
                          <TableCell>{driver.license_number}</TableCell>
                          <TableCell>
                            {driver.license_expiry 
                              ? format(new Date(driver.license_expiry), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{driver.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
