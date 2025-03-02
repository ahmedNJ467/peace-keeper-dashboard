
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, MessageCircle, UserCircle, MapPin, Calendar } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
import { TripMessage } from "@/lib/types/trip/communication";
import { TripAssignment } from "@/lib/types/trip/communication";
import { MessagesTab } from "@/components/trips/tabs/MessagesTab";
import { AssignmentsTab } from "@/components/trips/tabs/AssignmentsTab";
import { DetailsTab } from "@/components/trips/tabs/DetailsTab";
import { TripDetailHeader } from "@/components/trips/TripDetailHeader";
import { TripDetailActions } from "@/components/trips/TripDetailActions";
import { Driver } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/trips/utils";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";

interface TripDetailViewProps {
  viewTrip: DisplayTrip;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: TripMessage[];
  assignments: TripAssignment[];
  drivers: Driver[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function TripDetailView({ 
  viewTrip,
  activeTab,
  setActiveTab,
  messages,
  assignments,
  drivers,
  newMessage,
  setNewMessage,
  handleSendMessage,
  setTripToAssign,
  setAssignOpen,
  setTripToMessage,
  setMessageOpen,
  setEditTrip,
  setTripToDelete,
  setDeleteDialogOpen
}: TripDetailViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'in_progress': return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
        <DialogTitle className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-500" />
          {formatDate(viewTrip.date)}
          <span className="mx-2">•</span>
          <MapPin className="h-5 w-5 mr-2 text-purple-500" />
          {viewTrip.pickup_location.split(',')[0]}
        </DialogTitle>
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className={`font-medium ${getStatusColor(viewTrip.status)}`}>
            {viewTrip.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            {tripTypeDisplayMap[viewTrip.type]}
          </Badge>
        </div>
        
        <DialogDescription className="text-sm text-gray-600 mb-2">
          Trip ID: {viewTrip.id.substring(0, 8).toUpperCase()}
        </DialogDescription>
      </div>

      <TripDetailHeader viewTrip={viewTrip} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full bg-slate-100 p-1">
          <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-purple-700">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-purple-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-purple-700">
            <UserCircle className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4 mt-4">
          <DetailsTab viewTrip={viewTrip} />
        </TabsContent>
        <TabsContent value="messages" className="space-y-4 mt-4">
          <MessagesTab 
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
          />
        </TabsContent>
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <AssignmentsTab 
            viewTrip={viewTrip}
            assignments={assignments}
            drivers={drivers}
            setTripToAssign={setTripToAssign}
            setAssignOpen={setAssignOpen}
          />
        </TabsContent>
      </Tabs>
      
      <TripDetailActions 
        viewTrip={viewTrip}
        setEditTrip={setEditTrip}
        setTripToDelete={setTripToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
      />
    </div>
  );
}
