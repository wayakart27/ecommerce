"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserById, updateUser, deleteUser } from "@/actions/user"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const UserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["Admin", "User", "Customer"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  status: z.enum(["Active", "Inactive"], {
    errorMap: () => ({ message: "Status must be either Active or Inactive" }),
  }),
  isVerified: z.boolean().default(true),
  isTwoFactorEnabled: z.boolean().default(false),
  image: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional()
    .or(z.literal("")),
  confirmPassword: z.string().optional()
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "User",
      status: "Active",
      isVerified: true,
      isTwoFactorEnabled: false,
      image: "",
      password: "",
      confirmPassword: ""
    }
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!params?.id) return
        
        setIsLoading(true)
        const user = await getUserById(params.id)
        
        if (!user) {
          toast.error("User not found")
          router.push("/dashboard/users")
          return
        }

        form.reset({
          name: user.name || "",
          email: user.email || "",
          role: user.role,
          status: user.status,
          isVerified: user.isVerified ?? true,
          isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
          image: user.image || "",
          password: "",
          confirmPassword: ""
        })
      } catch (error) {
        toast.error(error.message || "Could not fetch user data")
        router.push("/dashboard/users")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [params?.id, router, form])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      toast.error("Please select a valid image file (JPEG, JPG, PNG, GIF)")
      return
    }

    if (file.size > 500 * 1024) {
      toast.error("Image size must be less than 500KB")
      return
    }

    setIsUploading(true)
    toast.loading("Uploading image...")

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        form.setValue("image", event.target.result.toString())
        setIsUploading(false)
        toast.dismiss()
        toast.success("Image updated successfully")
      }
    }
    reader.onerror = () => {
      setIsUploading(false)
      toast.dismiss()
      toast.error("Failed to read image file")
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data) => {
    try {
      const updateData = { ...data }
      if (!updateData.password) {
        delete updateData.password
      }
      delete updateData.confirmPassword

      const result = await updateUser(params.id, updateData)

      if (result.success) {
        toast.dismiss()
        toast.success("User updated successfully")
        router.push("/dashboard/users")
      } else {
        toast.dismiss()
        if (typeof result.error === 'string') {
          toast.error(result.error)
        } else {
          Object.values(result.error).forEach((errors) => {
            if (Array.isArray(errors)) {
              errors.forEach((error) => toast.error(error))
            } else if (typeof errors === 'object') {
              Object.values(errors).forEach((error) => {
                if (error && error._errors) {
                  error._errors.forEach((err) => toast.error(err))
                }
              })
            }
          })
        }
      }
    } catch (error) {
      toast.dismiss()
      toast.error(error.message || "Failed to update user")
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      toast.loading("Deleting user...")
      
      const result = await deleteUser(params.id)
      
      if (result.success) {
        toast.dismiss()
        toast.success("User deleted successfully")
        router.push("/dashboard/users")
      } else {
        toast.dismiss()
        toast.error(result.error || "Failed to delete user")
      }
    } catch (error) {
      toast.dismiss()
      toast.error(error.message || "Failed to delete user")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getInitials = (name) => {
    return name
      ?.split(" ")
      ?.map((n) => n[0])
      ?.join("")
      ?.toUpperCase() || "US"
  }

  return (
    <div className="flex flex-col gap-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            <p className="text-sm font-medium">Loading user data...</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        <Button
          variant="destructive"
          className="ml-auto"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Update the user's information and permissions.</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative">
                    <Avatar 
                      className="h-24 w-24 cursor-pointer" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <AvatarImage 
                        src={form.watch("image")} 
                        alt={form.watch("name")} 
                      />
                      <AvatarFallback className="text-lg">
                        {getInitials(form.watch("name"))}
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
                    accept="image/jpeg,image/jpg,image/png,image/gif" 
                    onChange={handleFileChange} 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Change Image
                  </Button>
                  <p className="text-sm text-muted-foreground">Max 500KB (JPEG, JPG, PNG, GIF)</p>
                </div>
                
                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Customer">Customer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Leave blank to keep current" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Confirm new password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Verified</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isTwoFactorEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                      </div>
                      <FormControl>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Requires an additional verification step during login</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isUploading || isLoading}>
                {form.formState.isSubmitting ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Update User
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Deleting...
                </div>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}