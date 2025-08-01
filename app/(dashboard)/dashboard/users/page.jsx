"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { PaginationControls } from "@/components/pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { deleteUser, getUsers } from "@/actions/user"
import { useSession } from "next-auth/react"

// Debounce function
const debounce = (func, delay) => {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => func.apply(this, args), delay)
  }
}

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''

  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState(search)
  const [filteredUsers, setFilteredUsers] = useState([])
  const [userToDelete, setUserToDelete] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 8
  })

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await getUsers(page, pagination.limit, search)
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Load users from server
  useEffect(() => {
    loadUsers()
  }, [page, search, pagination.limit])

  useEffect(() => {
    if (session?.user?.id && users.length > 0) {
      setFilteredUsers(users.filter(user => user?._id !== session?.user.id))
    } else {
      setFilteredUsers(users)
    }
  }, [users, session])

  // Debounced search handler
  const handleSearch = useCallback(debounce((term) => {
    setIsSearching(true)
    const params = new URLSearchParams()
    if (term) params.set('search', term)
    params.set('page', '1')
    router.push(`/dashboard/users?${params.toString()}`)
  }, 500), [router])

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    handleSearch(value)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/dashboard/users?${params.toString()}`)
  }

  const handleDelete = async (id) => {
    const userToRemove = users.find((user) => user._id === id)
    const userName = userToRemove?.name || id

    setActionInProgress(id)

    try {
      const result = await deleteUser(id)

      if (result.success) {
        toast.success(`User "${userName}" deleted successfully`)
        await loadUsers()
      } else {
        toast.error(result.error || "Failed to delete user")
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting user")
      console.error(error)
    } finally {
      setActionInProgress(null)
      setUserToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users/Customers</h1>
        <Button asChild>
          <Link href="/dashboard/users/add">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User/Customer Management</CardTitle>
          <CardDescription>Manage your users/Customer, add new ones, or update existing ones.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {isLoading && !isSearching ? (
            // Initial load skeleton (full table)
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                    <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                    <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                    <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="relative">
              {isSearching && (
                <div className="absolute inset-0 z-10 bg-background/80 flex items-center justify-center rounded-md">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    <p className="text-sm">Searching...</p>
                  </div>
                </div>
              )}
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S/N</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden lg:table-cell">Verified</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {searchTerm ? "No matching users found" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <TableRow key={user._id} className={actionInProgress === user._id ? "opacity-60" : ""}>
                          <TableCell className="font-medium">{index + 1}.</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === "Admin" ? "default" : user.role === "User" ? "secondary" : "outline"}
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{user.isVerified ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === "Active" ? "default" : user.status === "Pending" ? "outline" : "destructive"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={actionInProgress === user._id}>
                                  {actionInProgress === user._id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/users/edit/${user._id}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    if (actionInProgress === null) {
                                      setUserToDelete(user._id)
                                    }
                                  }}
                                  disabled={actionInProgress !== null}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-4 flex justify-end">
              <PaginationControls 
                currentPage={pagination.page} 
                totalPages={pagination.pages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}

          <AlertDialog
            open={userToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setTimeout(() => setUserToDelete(null), 100)
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user and remove their data from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (userToDelete) {
                      handleDelete(userToDelete)
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}