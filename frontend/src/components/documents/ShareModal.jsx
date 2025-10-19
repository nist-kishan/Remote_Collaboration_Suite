import React, { useState, useEffect } from "react";
import { 
  X, 
  UserPlus, 
  Mail, 
  Copy, 
  Users, 
  Crown, 
  Edit, 
  Eye,
  Trash2,
  Send,
  Link
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { toast } from "react-hot-toast";

const ShareModal = ({ 
  document, 
  isOpen, 
  onClose, 
  onShare, 
  onUpdateRole, 
  onRemoveCollaborator,
  onShareViaEmail,
  loading = false 
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [shareLink, setShareLink] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // "users" or "email"
  const [emailList, setEmailList] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailRole, setEmailRole] = useState("viewer");

  useEffect(() => {
    if (document && isOpen) {
      // Generate share link (in real app, this would come from backend)
      setShareLink(`${window.location.origin}/documents/shared/${document._id}`);
    }
  }, [document, isOpen]);

  const handleShare = () => {
    if (!email.trim()) return;
    
    onShare({
      userIds: [email], // In real app, you'd resolve email to user ID
      role
    });
    
    setEmail("");
  };

  const handleShareViaEmail = () => {
    if (!emailList.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    const emails = emailList.split(',').map(email => email.trim()).filter(email => email);
    
    if (emails.length === 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    onShareViaEmail({
      emails,
      role: emailRole,
      message: emailMessage
    });

    setEmailList("");
    setEmailMessage("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner": return <Crown className="w-4 h-4 text-purple-600" />;
      case "editor": return <Edit className="w-4 h-4 text-blue-600" />;
      case "viewer": return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner": return "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200";
      case "editor": return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200";
      case "viewer": return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Share Document
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {document?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Link */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Share Link
            </h3>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Add Users
                </div>
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "email"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Share
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "users" && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Add People
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <Button
                  onClick={handleShare}
                  disabled={!email.trim() || loading}
                  loading={loading}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Addresses
                </h3>
                <textarea
                  placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </h3>
                <select
                  value={emailRole}
                  onChange={(e) => setEmailRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal Message (Optional)
                </h3>
                <textarea
                  placeholder="Add a personal message to include in the email..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleShareViaEmail}
                disabled={!emailList.trim() || loading}
                loading={loading}
                className="w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Email Invitations
              </Button>
            </div>
          )}

          {/* Collaborators List */}
          {document?.collaborators && document.collaborators.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                People with Access ({document.collaborators.length})
              </h3>
              <div className="space-y-2">
                {document.collaborators.map((collaborator, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                        {collaborator.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {collaborator.user?.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {collaborator.user?.email || "No email"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {collaborator.role !== "owner" && (
                        <select
                          value={collaborator.role}
                          onChange={(e) => onUpdateRole(collaborator.user._id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                      )}
                      
                      {collaborator.role === "owner" && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(collaborator.role)} flex items-center gap-1`}>
                          {getRoleIcon(collaborator.role)}
                          Owner
                        </span>
                      )}

                      {collaborator.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveCollaborator(collaborator.user._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role Permissions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Permission Levels
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <Crown className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Owner</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Full control, can edit, share, and delete</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <Edit className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Editor</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Can edit and share</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <Eye className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Viewer</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Can only view</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
