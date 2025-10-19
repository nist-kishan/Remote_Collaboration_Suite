import React, { useEffect, useMemo, useState } from "react";
import {
  useCurrentUser,
  useUpdateProfile,
  useUpdateAvatar,
} from "../hook/useAuth";
import { ShieldCheck, UserCheck } from "lucide-react";
import PageLayout from "../components/ui/PageLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import AvatarUpdate from "../components/Profile/AvatarUpdate";
import AvatarForm from "../components/Profile/AvatarForm";
import EditableField from "../components/Profile/EditableField";

export default function Profile() {
  const { data: userData, isLoading } = useCurrentUser();
  const user = useMemo(
    () => (userData?.user ? userData.user : userData),
    [userData]
  );

  const [editMode, setEditMode] = useState({
    name: false,
    username: false,
    phone: false,
    countrycode: false,
  });

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    countrycode: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const { mutate: updateProfile, isLoading: updatingProfile } =
    useUpdateProfile();
  const { mutate: updateAvatar, isLoading: updatingAvatar } = useUpdateAvatar();

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      username: user.username ?? "",
      phone: user.phone ?? "",
      countrycode: user.countrycode ?? "",
    });
    setAvatarPreview(user.avatar ?? "");
  }, [user]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const startEdit = (field) => setEditMode((s) => ({ ...s, [field]: true }));
  const cancelEdit = (field) => {
    setForm((f) => ({ ...f, [field]: user?.[field] ?? "" }));
    setEditMode((s) => ({ ...s, [field]: false }));
  };

  const handleChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const buildPayload = () => {
    const payload = {};
    if (user?.name !== form.name && form.name.trim() !== "")
      payload.name = form.name.trim();
    if (user?.username !== form.username && form.username.trim() !== "")
      payload.username = form.username.trim();
    return payload;
  };

  const handleSaveField = (field) => {
    const payload = {};
    if (field === "name" && user?.name !== form.name) payload.name = form.name;
    if (field === "username" && user?.username !== form.username)
      payload.username = form.username;

    if (Object.keys(payload).length === 0) {
      setEditMode((s) => ({ ...s, [field]: false }));
      return;
    }

    updateProfile(payload, {
      onSuccess: () => {
        setEditMode((s) => ({ ...s, [field]: false }));
      },
    });
  };

  const handleSaveAll = () => {
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      Object.keys(editMode).forEach((f) =>
        editMode[f] ? setEditMode((s) => ({ ...s, [f]: false })) : null
      );
      return;
    }
    updateProfile(payload, {
      onSuccess: () => {
        setEditMode({
          name: false,
          username: false,
          phone: false,
          countrycode: false,
        });
      },
    });
  };

  const handleAvatarSubmit = (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append("avatar", avatarFile);
    updateAvatar(fd, {
      onSuccess: () => {
        setAvatarFile(null);
      },
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600 dark:text-gray-300">
            Loading profile...
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Your Profile">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <AvatarUpdate
              avatarPreview={avatarPreview}
              name={user.name}
              setAvatarFile={setAvatarFile}
            />
            {avatarFile && (
              <AvatarForm
                handleAvatarSubmit={handleAvatarSubmit}
                updatingAvatar={updatingAvatar}
                setAvatarFile={setAvatarFile}
                setAvatarPreview={setAvatarPreview}
                avatar={user.avatar}
              />
            )}
            
            {/* Status */}
            <div className="mt-6">
              <div className="flex items-center justify-center gap-2">
                {user?.isVerify ? (
                  <span className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-yellow-500 dark:text-yellow-400">
                    <UserCheck className="w-4 h-4" /> Not Verified
                  </span>
                )}
              </div>
              {typeof user?.isActive !== "undefined" && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {user.isActive ? "Active" : "Inactive"}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Profile Fields */}
        <div className="lg:col-span-2">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField
                label="Name"
                value={form.name}
                editMode={editMode.name}
                onChange={(val) => handleChange("name", val)}
                onStartEdit={() => startEdit("name")}
                onSave={() => handleSaveField("name")}
                onCancel={() => cancelEdit("name")}
              />

              <EditableField
                label="Username"
                value={form.username}
                editMode={editMode.username}
                onChange={(val) => handleChange("username", val)}
                onStartEdit={() => startEdit("username")}
                onSave={() => handleSaveField("username")}
                onCancel={() => cancelEdit("username")}
              />

              <EditableField 
                label="Email" 
                value={user.email} 
                readOnly 
              />

              <EditableField
                label="Phone"
                value={`${user.countrycode || ""} ${user.phone || ""}`}
                readOnly
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSaveAll}
                loading={updatingProfile}
                disabled={updatingProfile}
                className="w-full sm:w-auto"
              >
                Save All Changes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
