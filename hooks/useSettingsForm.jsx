// hooks/useSettingsForm.js
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import {
  updateProfile,
  updatePassword,
  updateTwoFactor,
  getProfile,
  getTwoFactor,
} from '@/actions/user';

export function useSettingsForm() {
  const { data: session, update: updateSession, status } = useSession();
  
  // State declarations
  const [isFetching, setIsFetching] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSaving2FA, setIsSaving2FA] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    image: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const userId = session?.user?.id || '';

  // Data fetching
  const refreshData = async () => {
    if (!userId) return;

    setIsFetching(true);
    try {
      const [profileResult, twoFactorResult] = await Promise.all([
        getProfile(userId),
        getTwoFactor(userId),
      ]);

      if (profileResult.success) {
        setProfileData({
          id: userId,
          name: profileResult.data.name || '',
          email: profileResult.data.email || '',
          image: profileResult.data.image || ''
        });
      }

      if (twoFactorResult.success) {
        setTwoFactorEnabled(twoFactorResult.data);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      refreshData();
    }
  }, [status, userId]);

  // Form handlers
  const handleProfileSubmit = async (formData) => {
    if (!userId) return;
    
    setIsSavingProfile(true);
    try {
      formData.append('id', userId);
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast.success('Profile updated successfully');
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: formData.get('name'),
            image: formData.get('image')
          }
        });
      } else {
        handleProfileError(result.error);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (formData) => {
    if (!userId) return;
    
    setIsSavingPassword(true);
    try {
      formData.append('id', userId);
      const result = await updatePassword(formData);
      
      if (result.success) {
        toast.success('Password updated successfully');
        signOut({ callbackUrl: '/auth/signin?passwordChanged=true' });
      } else {
        handlePasswordError(result.error);
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleTwoFactorChange = async (enabled) => {
    if (!userId) return;
    
    setIsSaving2FA(true);
    try {
      const formData = new FormData();
      formData.append('id', userId);
      formData.append('twoFactorEnabled', enabled.toString());
      
      const result = await updateTwoFactor(formData);
      
      if (result.success) {
        setTwoFactorEnabled(enabled);
        toast.success('Two-factor authentication updated');
      } else {
        toast.error('Failed to update two-factor authentication', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Failed to update two-factor authentication');
    } finally {
      setIsSaving2FA(false);
    }
  };

  // Image upload handler (now self-contained)
const handleImageUpload = async (file) => {
  // Step 1: Validate file object exists
  if (!file) {
    throw new Error('No file selected');
  }

  // Step 2: Verify it's a proper File/Blob object
  if (!(file instanceof Blob)) {
    throw new Error('Invalid file type');
  }

  // Step 3: Check if file type can be determined
  if (typeof file.type !== 'string') {
    throw new Error('Cannot determine file type');
  }

  setIsUploading(true);

  try {
    // Step 4: Validate image type
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (!validImageTypes.includes(file.type)) {
      throw new Error(
        'Only JPG, PNG, GIF, WEBP, or SVG images are allowed'
      );
    }

    // Step 5: Validate file size (500KB limit)
    const MAX_SIZE = 500 * 1024; // 500KB
    if (file.size > MAX_SIZE) {
      toast.error(
        `Image too large (max ${MAX_SIZE / 1024}KB)`
      );
      return;
    }

    // Step 6: Convert to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };

      reader.readAsDataURL(file);
    });

    // Step 7: Update profile data
    setProfileData(prev => ({
      ...prev,
      image: base64Image
    }));

    return base64Image;
  } catch (error) {
    console.error('Image upload error:', error);
    toast.error(error.message || 'Image upload failed');
    throw error; // Re-throw for component handling
  } finally {
    setIsUploading(false);
  }
};

  // Error handlers
  const handleProfileError = (error) => {
    let errorMessages = 'Failed to update profile';
    
    if (typeof error === 'object') {
      errorMessages = Object.values(error)
        .flatMap(errorObj => errorObj?._errors || [])
        .filter(Boolean)
        .join(', ') || 'Please check your inputs';
    } else if (typeof error === 'string') {
      errorMessages = error;
    }

    toast.error('Profile update failed', {
      description: errorMessages,
    });
  };

  const handlePasswordError = (error) => {
    const errorMessages = typeof error === 'object' 
      ? Object.values(error)
          .flatMap(errorObj => errorObj?._errors || [])
          .filter(Boolean)
          .join(', ')
      : error || 'Please check your password requirements';

    toast.error('Password update failed', {
      description: errorMessages,
    });
  };

  return {
    // Loading states
    isFetching,
    isSaving: isSavingProfile || isSavingPassword || isSaving2FA,
    isSavingProfile,
    isSavingPassword,
    isSaving2FA,
    isUploading,
    
    // Data states
    profileData,
    twoFactorEnabled,
    passwordForm,
    
    // Setters
    setProfileData,
    setPasswordForm,
    
    // Handlers
    handleProfileSubmit,
    handlePasswordSubmit,
    handleTwoFactorChange,
    handleImageUpload, // Use this instead of setIsUploading
    refreshData
  };
}