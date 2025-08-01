import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="rounded-md border">
            <div className="p-4">
              <div className="flex items-center gap-4 py-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-10 ml-auto" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
