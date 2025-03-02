
import { useState } from "react";
import { MemberFormValues } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useMembers(initialMembers: MemberFormValues[], onMembersChange: (members: MemberFormValues[]) => void) {
  const { toast } = useToast();
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isViewingMember, setIsViewingMember] = useState<boolean>(false);
  const [viewingMemberIndex, setViewingMemberIndex] = useState<number | null>(null);
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [memberFormState, setMemberFormState] = useState<MemberFormValues>({
    name: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
    document_url: "",
    document_name: ""
  });

  const addMember = () => {
    setIsAddingMember(true);
    setMemberFormState({
      id: crypto.randomUUID(), // Generate a temporary ID for new members
      name: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      document_url: "",
      document_name: ""
    });
  };

  const editMember = (index: number) => {
    setEditingMemberIndex(index);
    setMemberFormState({...initialMembers[index]});
    setIsAddingMember(true);
  };

  const viewMember = (index: number) => {
    setViewingMemberIndex(index);
    setIsViewingMember(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewingMember(false);
    // Don't reset the viewingMemberIndex until the dialog is fully closed
    // This prevents the component from trying to access a non-existent member
  };

  const cancelMemberEdit = () => {
    setIsAddingMember(false);
    setEditingMemberIndex(null);
    setMemberFormState({
      name: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      document_url: "",
      document_name: ""
    });
  };

  const saveMember = () => {
    if (!memberFormState.name || memberFormState.name.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Member name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    if (memberFormState.email && !memberFormState.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    const newMembers = [...initialMembers];
    
    if (editingMemberIndex !== null) {
      // Edit existing member
      newMembers[editingMemberIndex] = memberFormState;
    } else {
      // Add new member
      newMembers.push(memberFormState);
    }
    
    onMembersChange(newMembers);
    setIsAddingMember(false);
    setEditingMemberIndex(null);
    setMemberFormState({
      name: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      document_url: "",
      document_name: ""
    });

    toast({
      title: editingMemberIndex !== null ? "Member Updated" : "Member Added",
      description: editingMemberIndex !== null 
        ? "The member has been updated successfully."
        : "A new member has been added successfully.",
    });
  };

  const deleteMember = (index: number) => {
    const newMembers = [...initialMembers];
    newMembers.splice(index, 1);
    onMembersChange(newMembers);

    toast({
      title: "Member Removed",
      description: "The member has been removed successfully.",
    });
  };

  const handleMemberDocumentUpload = (url: string, name: string) => {
    setMemberFormState({
      ...memberFormState,
      document_url: url,
      document_name: name
    });
  };

  const clearMemberDocument = () => {
    setMemberFormState({
      ...memberFormState,
      document_url: "",
      document_name: ""
    });
  };

  return {
    memberFormState,
    setMemberFormState,
    editingMemberIndex,
    isViewingMember,
    viewingMemberIndex,
    isAddingMember,
    addMember,
    editMember,
    viewMember,
    handleCloseViewDialog,
    cancelMemberEdit,
    saveMember,
    deleteMember,
    handleMemberDocumentUpload,
    clearMemberDocument
  };
}
