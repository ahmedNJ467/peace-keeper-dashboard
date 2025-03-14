
import { Dialog } from "@/components/ui/dialog";
import { useClientForm } from "./client-form/use-client-form";
import { ClientDocument, ClientContact, ClientMember } from "./client-form/types";
import { DeleteClientDialog } from "./client-form/delete-client-dialog";
import { useClientDialog } from "./client-form/use-client-dialog";
import { useClientFormSubmit } from "./client-form/use-client-form-submit";
import { useCallback, useMemo, useEffect } from "react";
import { ClientDialogContent } from "./client-form/client-dialog-content";
import { Client } from "@/lib/types/client";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onClientDeleted?: () => void;
}

export function ClientFormDialog({ open, onOpenChange, client, onClientDeleted }: ClientFormDialogProps) {
  const {
    showDeleteConfirm,
    setShowDeleteConfirm,
    activeTab,
    setActiveTab,
    deletionError,
    handleDelete,
    handleRestore,
    showPermanentDeleteConfirm,
    setShowPermanentDeleteConfirm,
    permanentDeletionError,
    setPermanentDeletionError,
    isPerformingAction,
    setIsPerformingAction,
    handlePermanentDelete
  } = useClientDialog(client, onOpenChange, onClientDeleted);
  
  const {
    form,
    isSubmitting,
    setIsSubmitting,
    contacts,
    setContacts,
    members,
    setMembers,
    documents,
    setDocuments,
    documentFiles,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    uploadProfile,
    uploadClientDocument,
    profileFile
  } = useClientForm(client);
  
  // Close form after successful submission
  useEffect(() => {
    if (isSubmitting === false && form.formState.isSubmitSuccessful) {
      setTimeout(() => {
        onOpenChange(false);
      }, 500); // Short delay to ensure data is saved
    }
  }, [isSubmitting, form.formState.isSubmitSuccessful, onOpenChange]);

  const { handleSubmit: submitFormFn } = useClientFormSubmit();
  
  // Generate dialog title based on client state
  const dialogTitle = useMemo(() => {
    if (!client) return "Add New Client";
    return (client.is_archived || client.archived) 
      ? `Archived Client: ${client.name}`
      : `Edit Client: ${client.name}`;
  }, [client]);
  
  // Memoize the handleFormSubmit function to prevent recreation on each render
  const handleFormSubmit = useCallback(async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // Create adapter functions to match the expected types
      const profileUploadAdapter = async (file: File): Promise<string> => {
        if (!file) return '';
        // Use the uploadProfile function with the file itself
        const result = await uploadProfile(file);
        return result || '';
      };
      
      const documentUploadAdapter = async (file: File, name: string): Promise<string> => {
        // Create a mock FileList with the single file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const fileList = dataTransfer.files;
        
        // Upload the document
        const result = await uploadClientDocument(fileList, name);
        if (Array.isArray(result) && result.length > 0) {
          return result[0].url || '';
        }
        return '';
      };
      
      // Convert documentFiles to the expected Record format
      const documentFilesRecord: Record<string, File> = {};
      if (Array.isArray(documentFiles)) {
        documentFiles.forEach((file, index) => {
          documentFilesRecord[`file_${index}`] = file;
        });
      }
      
      // Pass profileFile directly to form values if it exists
      if (profileFile) {
        values.profile_image_file = profileFile;
      }
      
      const result = await submitFormFn({
        client,
        values,
        profileUploadFn: profileUploadAdapter,
        documents,
        documentFiles: documentFilesRecord,
        contacts: contacts as ClientContact[],
        members: members as ClientMember[],
        uploadDocumentFn: documentUploadAdapter,
        setIsSubmitting,
        onSuccess: () => {
          // The form will close automatically due to the useEffect above
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      return false;
    }
  }, [
    client,
    uploadProfile,
    documents,
    documentFiles,
    contacts,
    members,
    uploadClientDocument,
    setIsSubmitting,
    submitFormFn,
    profileFile
  ]);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== docId));
  }, [documents, setDocuments]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow dialog to close if we're not in the middle of confirming a delete or performing an action
      if (!showDeleteConfirm && !showPermanentDeleteConfirm && !isSubmitting && !isPerformingAction) {
        onOpenChange(newOpen);
      }
    }}>
      <ClientDialogContent
        client={client}
        dialogTitle={dialogTitle}
        form={form}
        isSubmitting={isSubmitting}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contacts={contacts}
        setContacts={setContacts}
        members={members}
        setMembers={setMembers}
        documents={documents}
        documentFiles={documentFiles}
        profilePreview={profilePreview}
        handleProfileChange={handleProfileChange}
        handleDocumentUpload={handleDocumentUpload}
        removeDocument={removeDocument}
        onOpenChange={onOpenChange}
        onDelete={() => {
          setShowDeleteConfirm(true);
        }}
        onRestore={handleRestore}
        onPermanentDelete={() => {
          setShowPermanentDeleteConfirm(true);
        }}
        handleFormSubmit={handleFormSubmit}
        isArchived={!!(client?.archived || client?.is_archived)}
      />
      
      {showDeleteConfirm && (
        <DeleteClientDialog
          clientName={client?.name}
          isOpen={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDelete}
          error={deletionError}
          archiveMode={true}
        />
      )}
      
      {showPermanentDeleteConfirm && (
        <DeleteClientDialog
          clientName={client?.name}
          isOpen={showPermanentDeleteConfirm}
          onOpenChange={setShowPermanentDeleteConfirm}
          onConfirm={handlePermanentDelete}
          error={permanentDeletionError}
          permanentDelete={true}
          isSubmitting={isPerformingAction}
        />
      )}
    </Dialog>
  );
}
