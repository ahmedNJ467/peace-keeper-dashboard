
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Mail, 
  FileText, 
  MoreHorizontal, 
  Copy, 
  Check,
  Trash,
  Printer,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuotationFormDialog } from "@/components/quotation-form-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTitle, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface Quotation {
  id: string;
  date: string;
  client_id: string;
  client_name: string;
  status: "draft" | "sent" | "approved" | "rejected" | "expired";
  total_amount: number;
  valid_until: string;
  notes?: string;
  items: QuotationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export default function Quotations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Get quotations
  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          clients:client_id (name, email)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;

      // Map the data to match our Quotation interface
      return data.map(quote => ({
        id: quote.id,
        date: quote.date,
        client_id: quote.client_id,
        client_name: quote.clients?.name || 'Unknown Client',
        client_email: quote.clients?.email,
        status: quote.status,
        total_amount: quote.total_amount,
        valid_until: quote.valid_until,
        notes: quote.notes,
        items: quote.items || [],
        created_at: quote.created_at,
        updated_at: quote.updated_at
      }));
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('quotations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quotations' }, 
        () => {
          // Force refresh the quotations data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get clients for the form
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    // When dialog closes, reset the selected quotation
    if (!open) {
      setSelectedQuotation(null);
    }
  };

  const handleQuotationClick = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setFormOpen(true);
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setViewQuotation(quotation);
  };

  const handleDeleteClick = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;
    
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', quotationToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Quotation deleted",
        description: "The quotation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete the quotation.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
      setQuotationToDelete(null);
    }
  };

  const handleSendQuotation = async (quotation: Quotation) => {
    setIsSending(true);
    try {
      const client = clients?.find(c => c.id === quotation.client_id);
      
      if (!client?.email) {
        toast({
          title: "Error",
          description: "Client does not have an email address.",
          variant: "destructive",
        });
        return;
      }

      // Send the quotation via the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          quotationId: quotation.id,
          clientEmail: client.email,
          clientName: client.name
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to send quotation");
      }

      // Update quotation status to "sent"
      await supabase
        .from('quotations')
        .update({ status: 'sent' })
        .eq('id', quotation.id);

      toast({
        title: "Quotation sent",
        description: `The quotation has been sent to ${client.email}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error) {
      console.error("Error sending quotation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send the quotation",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDuplicateQuotation = async (quotation: Quotation) => {
    try {
      // Create a new quotation based on the existing one
      const newQuotation = {
        client_id: quotation.client_id,
        date: new Date().toISOString().split('T')[0], // Today's date
        status: 'draft' as const,
        total_amount: quotation.total_amount,
        valid_until: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days from now
        notes: quotation.notes,
        items: quotation.items
      };
      
      const { error } = await supabase
        .from('quotations')
        .insert(newQuotation);
      
      if (error) throw error;
      
      toast({
        title: "Quotation duplicated",
        description: "A new draft quotation has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the quotation.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Quotation['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredQuotations = quotations?.filter(quote => 
    quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (quotationsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Quotations</h2>
            <p className="text-muted-foreground">Loading quotations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">Manage client quotations</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Quotation
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quotations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 mb-4"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No quotations found. Create your first quotation!
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations?.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>{format(new Date(quote.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{quote.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(quote.status)}`}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>${quote.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(quote.valid_until), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewQuotation(quote)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuotationClick(quote)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSendQuotation(quote)}
                          disabled={quote.status === 'sent' || quote.status === 'approved' || isSending}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send to Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicateQuotation(quote)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(quote)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quotation form dialog */}
      <QuotationFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        quotation={selectedQuotation}
        clients={clients || []}
      />

      {/* Quotation view dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={(open) => !open && setViewQuotation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Quotation Details</DialogTitle>
          {viewQuotation && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-semibold">#{viewQuotation.id}</h3>
                  <p className="text-muted-foreground">
                    Created: {format(new Date(viewQuotation.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(viewQuotation.status)}`}>
                  {viewQuotation.status.charAt(0).toUpperCase() + viewQuotation.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Client</h4>
                  <p>{viewQuotation.client_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Valid Until</h4>
                  <p>{format(new Date(viewQuotation.valid_until), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              {viewQuotation.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground">{viewQuotation.notes}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewQuotation.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total:</TableCell>
                        <TableCell className="text-right font-bold">${viewQuotation.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setViewQuotation(null)}>
                  Close
                </Button>
                <Button onClick={() => handleSendQuotation(viewQuotation)} disabled={viewQuotation.status === 'sent' || viewQuotation.status === 'approved' || isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send to Client
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm deletion dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quotation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
