"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload } from "lucide-react"
import { createUser } from "@/actions/user"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

export default function AddUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "User",
    isVerified: false,
    isTwoFactorEnabled: false,
    status: "Active",
    image: "",
  })

  const validatePassword = (password) => {
    const errors = []
    
    if (password.length < 6) {
      errors.push("Must be at least 6 characters")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Must contain at least one number")
    }
    
    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const handleVerifiedChange = (checked) => {
    setFormData((prev) => ({ ...prev, isVerified: checked }))
  }

  const handleTwoFactorChange = (checked) => {
    setFormData((prev) => ({ ...prev, isTwoFactorEnabled: checked }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

 const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Check file type
  if (!file.type.startsWith('image/')) {
    toast.error("Please select an image file");
    return;
  }

  // Check file size (500KB = 500 * 1024 bytes)
  const maxSize = 500 * 1024;
  if (file.size > maxSize) {
    toast.error("Image size exceeds 500KB. Please choose a smaller file.");
    return;
  }

  setIsUploading(true);

  const reader = new FileReader();
  reader.onload = (event) => {
    if (event.target?.result) {
      setFormData((prev) => ({ 
        ...prev, 
        image: event.target.result 
      }));
      setIsUploading(false);
      toast.success("Avatar uploaded successfully");
    }
  };
  reader.onerror = () => {
    setIsUploading(false);
    toast.error("Failed to read the image file.");
  };
  reader.readAsDataURL(file);
};

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate password
    const passwordErrors = validatePassword(formData.password)
    if (passwordErrors.length > 0) {
      toast.error("Password doesn't meet requirements", {
        description: passwordErrors.join(", ")
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data for server action
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        isVerified: formData.isVerified,
        isTwoFactorEnabled: formData.isTwoFactorEnabled,
        image: formData.image,
        status: formData.status
      }

      const result = await createUser(userData)

      if (result?.success) {
        toast.success(`User ${userData.name} created successfully`)
        router.push("/dashboard/users")
      } else {
        toast.error(result?.error || "Failed to create user")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error creating user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const passwordErrors = validatePassword(formData.password)
  const isPasswordValid = passwordErrors.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Add a new user to the system</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                    {formData.image ? (
                      <AvatarImage src={formData.image} alt={formData.name || "User avatar"} />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {getInitials(formData.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  )}
                </div>
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
                  onClick={handleAvatarClick} 
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Avatar
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {formData.password && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Password Requirements:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li className={formData.password.length >= 6 ? "text-green-500" : "text-red-500"}>
                        At least 6 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? "text-green-500" : "text-red-500"}>
                        At least one uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? "text-green-500" : "text-red-500"}>
                        At least one lowercase letter
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? "text-green-500" : "text-red-500"}>
                        At least one number
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={handleRoleChange} 
                  required
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={handleStatusChange} 
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="verified" 
                  checked={formData.isVerified} 
                  onCheckedChange={handleVerifiedChange} 
                />
                <Label htmlFor="verified">Email Verified</Label>
              </div>

              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="twoFactor" 
                          checked={formData.isTwoFactorEnabled} 
                          onCheckedChange={handleTwoFactorChange} 
                        />
                        <Label htmlFor="twoFactor">Enable Two-Factor Authentication</Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Requires an additional verification step during login</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/users")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading || !isPasswordValid}
            >
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> 
                  Add User
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}