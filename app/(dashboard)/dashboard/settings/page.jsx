// app/settings/page.jsx
'use client';

import { useState, useRef } from 'react';
import { Check, Key, Lock, Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsForm } from '@/hooks/useSettingsForm';

export default function SettingsPage() {
  const { update } = useSession();
  const {
    isFetching,
    isSaving,
    isUploading,
    profileData,
    twoFactorEnabled,
    passwordForm,
    setProfileData,
    setPasswordForm,
    handleImageUpload,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleTwoFactorChange,
  } = useSettingsForm();

  const fileInputRef = useRef(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getLoaderMessage = () => {
    if (isUploading) return "Uploading your profile picture...";
    if (isSaving) return "Saving your changes...";
    if (isFetching) return "Loading your settings...";
    return "";
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await handleImageUpload(file);
    } catch {
      e.target.value = '';
    }
  };

  const handleNameChange = (e) => setProfileData(prev => ({ ...prev, name: e.target.value }));
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Modified profile submit handler that updates session
  const handleSubmitProfile = async (formData) => {
    const result = await handleProfileSubmit(formData);
    
    if (result?.success) {
      // Update session with new name
      await update({
        user: {
          name: profileData.name,
          image: profileData.image
        }
      });
    }
    
    return result;
  };

  const getInitials = () => profileData.name ? profileData.name.substring(0, 2).toUpperCase() : 'US';

  return (
    <div className="flex flex-col gap-4 relative">
      {(isFetching || isSaving || isUploading) && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center flex-col gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            {getLoaderMessage()}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="py-2 data-[state=active]:bg-primary/10">
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="py-2 data-[state=active]:bg-primary/10">
            Password
          </TabsTrigger>
          <TabsTrigger value="security" className="py-2 data-[state=active]:bg-primary/10">
            Security
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <form action={(formData) => {
                formData.append('id', profileData.id);
                formData.append('name', profileData.name);
                formData.append('image', profileData.image);
                return handleSubmitProfile(formData);
              }}>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex flex-col items-start gap-6 sm:flex-row mt-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-24 w-24 cursor-pointer" onClick={handleImageClick}>
                        {profileData.image && <AvatarImage src={profileData.image} alt="Profile" />}
                        <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImageClick}
                        disabled={isFetching || isSaving || isUploading}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Change Image</span>
                      </Button>
                    </div>
                    <div className="w-full space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleNameChange}
                          required
                          disabled={isFetching || isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          value={profileData.email}
                          type="email"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 mt-4">
                  <SubmitButton disabled={isFetching || isSaving}>
                    Save Changes
                  </SubmitButton>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-6">
            <Card>
              <form action={(formData) => {
                formData.append('id', profileData.id);
                formData.append('currentPassword', passwordForm.currentPassword);
                formData.append('newPassword', passwordForm.newPassword);
                return handlePasswordSubmit(formData);
              }}>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password securely</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        disabled={isFetching || isSaving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        disabled={isFetching || isSaving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        disabled={isFetching || isSaving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 mt-4">
                  <SubmitButton disabled={isFetching || isSaving} className="gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Update Password</span>
                  </SubmitButton>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Key className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {twoFactorEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleTwoFactorChange}
                    disabled={isFetching || isSaving}
                  />
                </div>

                {twoFactorEnabled && (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <p className="font-medium">Two-factor authentication is active</p>
                    </div>
                    <Separator className="my-4" />
                    <p className="text-sm text-muted-foreground">
                      A verification code will be sent to your email at login.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleTwoFactorChange(false)}
                        disabled={isFetching || isSaving}
                      >
                        <Lock className="h-4 w-4" />
                        <span>Disable 2FA</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SubmitButton({ children, className = '', disabled = false }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className={`gap-2 transition-all ${className}`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}