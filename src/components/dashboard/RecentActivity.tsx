
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { Calendar, Clock, User, Car, FileText, Activity, Clock3, Fuel, FileCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { enableRealtimeForTable } from "@/utils/supabase-helpers";

interface RecentActivityProps {
  isLoading?: boolean;
  activities?: ActivityItemProps[];
}

export const RecentActivity = ({ activities: propActivities, isLoading: propIsLoading }: RecentActivityProps) => {
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityItemProps[]>([]);

  // Setup realtime for activities table
  useEffect(() => {
    // Enable realtime for activities table
    const setupRealtime = async () => {
      try {
        await enableRealtimeForTable('activities');
      } catch (error) {
        console.error("Failed to enable realtime for activities:", error);
      }
    };
    
    setupRealtime();
  }, []);

  const { data: fetchedActivities, isLoading } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      if (propActivities) return propActivities;
      
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        title: item.title,
        timestamp: new Date(item.timestamp).toLocaleString(),
        type: item.type as ActivityItemProps['type'],
        icon: item.type
      })) as ActivityItemProps[];
    },
    enabled: !propActivities,
  });

  // Set up realtime subscription
  useEffect(() => {
    const activities = fetchedActivities || [];
    setRealtimeActivities(activities);

    const channel = supabase
      .channel('public:activities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities'
      }, async (payload) => {
        console.log('Realtime activity update:', payload);
        
        // Refresh activities when there's a change
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(5);
        
        if (!error && data) {
          const formattedActivities = data.map(item => ({
            id: item.id,
            title: item.title,
            timestamp: new Date(item.timestamp).toLocaleString(),
            type: item.type as ActivityItemProps['type'],
            icon: item.type
          })) as ActivityItemProps[];
          
          setRealtimeActivities(formattedActivities);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchedActivities]);

  const loadingState = propIsLoading !== undefined ? propIsLoading : isLoading;
  const displayActivities = propActivities || realtimeActivities;

  if (loadingState) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!displayActivities || displayActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p>No recent activities</p>
        <p className="text-xs mt-1">Check back later for updates</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'trip':
        return <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20"><Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>;
      case 'maintenance':
        return <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/20"><Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>;
      case 'driver':
        return <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20"><User className="h-4 w-4 text-green-600 dark:text-green-400" /></div>;
      case 'vehicle':
        return <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/20"><Car className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>;
      case 'fuel':
        return <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20"><Fuel className="h-4 w-4 text-red-600 dark:text-red-400" /></div>;
      case 'contract':
        return <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20"><FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>;
      default:
        return <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-900/20"><FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" /></div>;
    }
  };

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 border rounded-lg bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
        >
          {getActivityIcon(activity.type)}
          <div>
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock3 className="inline-block h-3 w-3 mr-1 opacity-70" />
              {activity.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
