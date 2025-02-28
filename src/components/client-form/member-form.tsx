
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { MemberFormValues } from "./types";
import { MemberDocumentUpload } from "./member-document-upload";

interface MemberFormProps {
  isEditing: boolean;
  member: MemberFormValues;
  clientId?: string;
  onMemberChange: (member: MemberFormValues) => void;
  onCancel: () => void;
  onSave: () => void;
  onDocumentUploaded: (url: string, name: string) => void;
  onDocumentClear: () => void;
}

export function MemberForm({
  isEditing,
  member,
  clientId,
  onMemberChange,
  onCancel,
  onSave,
  onDocumentUploaded,
  onDocumentClear
}: MemberFormProps) {
  console.log("MemberForm render - clientId:", clientId, "memberId:", member.id);
  console.log("Member document info:", { url: member.document_url, name: member.document_name });

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {isEditing ? "Edit Member" : "Add New Member"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={member.name}
            onChange={(e) => onMemberChange({...member, name: e.target.value})}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input
            value={member.role || ""}
            onChange={(e) => onMemberChange({...member, role: e.target.value})}
            placeholder="Position at organization"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={member.email || ""}
            onChange={(e) => onMemberChange({...member, email: e.target.value})}
            placeholder="Contact email"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={member.phone || ""}
            onChange={(e) => onMemberChange({...member, phone: e.target.value})}
            placeholder="Contact number"
          />
        </div>
        
        {/* Passport Upload */}
        <div className="col-span-2">
          {clientId ? (
            <MemberDocumentUpload
              documentName={member.document_name || null}
              documentUrl={member.document_url || null}
              clientId={clientId}
              memberId={member.id || crypto.randomUUID()}
              onDocumentUploaded={onDocumentUploaded}
              onDocumentClear={onDocumentClear}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              Passport/ID upload will be available after saving the client.
            </div>
          )}
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={member.notes || ""}
            onChange={(e) => onMemberChange({...member, notes: e.target.value})}
            rows={3}
            placeholder="Additional information about this member"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave}>
          {isEditing ? "Update Member" : "Add Member"}
        </Button>
      </div>
    </div>
  );
}
