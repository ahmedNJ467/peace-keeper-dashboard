
import { useState, useEffect, useCallback } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientFormValues } from "./types";
import { useClientContacts } from "./use-client-contacts";
import { useClientMembers } from "./use-client-members";
import { useClientDocuments } from "./use-client-documents";
import { useClientProfile } from "./use-client-profile";

export function useClientForm(client: any | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with client data or defaults
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      type: client?.type || "organization",
      description: client?.description || "",
      website: client?.website || "",
      address: client?.address || "",
      contact: client?.contact || "",
      email: client?.email || "",
      phone: client?.phone || "",
    },
  });

  // Get client type from form
  const clientType = form.watch("type");

  // Initialize client data based on type (organization or individual)
  const { contacts, setContacts } = useClientContacts(client?.id, clientType);
  const { members, setMembers } = useClientMembers(client?.id, clientType);
  const { 
    documents, 
    setDocuments, 
    documentFiles,
    setDocumentFiles,
    handleDocumentUpload: handleDocUpload,
    resetDocuments
  } = useClientDocuments(client?.documents || []);
  const {
    profileFile,
    profilePreview,
    handleProfileChange,
    uploadProfile,
    resetProfile
  } = useClientProfile(client?.profile_image_url);

  // Handle document upload with client ID if available - memoize callback
  const handleDocumentUpload = useCallback((files: FileList) => {
    if (client?.id) {
      return handleDocUpload(files, client.id);
    } else {
      return handleDocUpload(files);
    }
  }, [client?.id, handleDocUpload]);

  // Function to upload document with client ID - memoize callback
  const uploadClientDocument = useCallback(async (files: FileList, clientId: string) => {
    try {
      return await handleDocUpload(files, clientId);
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }, [handleDocUpload]);

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name || "",
        type: client.type || "organization",
        description: client.description || "",
        website: client.website || "",
        address: client.address || "",
        contact: client.contact || "",
        email: client.email || "",
        phone: client.phone || "",
      });
      
      // Reset profile and documents only if client changes
      resetProfile(client.profile_image_url);
      resetDocuments(client.documents || []);
    } else {
      form.reset({
        name: "",
        type: "organization",
        description: "",
        website: "",
        address: "",
        contact: "",
        email: "",
        phone: "",
      });
      
      // Reset profile and documents for new client
      resetProfile();
      resetDocuments();
    }
  }, [client?.id]); // Only run this effect when client ID changes, not on every client prop change

  return {
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
    setDocumentFiles,
    profileFile,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    uploadProfile,
    uploadClientDocument,
  };
}
