import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[240px]" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="w-full">
        <Skeleton className="h-10 w-[300px] mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="text-xs text-muted-foreground">
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="text-xs text-muted-foreground">
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="text-xs text-muted-foreground">
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="text-xs text-muted-foreground">
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-72" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}