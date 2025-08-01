import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "../ui/card"

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-[120px]" />
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-1" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </CardContent>
    </Card>
  )
}

export function RevenueChartSkeleton() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <Skeleton className="h-6 w-[180px]" />
      </CardHeader>
      <CardContent className="pl-2">
        <div className="flex items-end space-x-2 h-[300px] mt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <Skeleton className="h-[200px] w-full rounded-t-lg" style={{ 
                height: `${Math.random() * 70 + 30}%`,
                animationDelay: `${i * 0.05}s`
              }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SalesTableSkeleton() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <Skeleton className="h-6 w-[180px] mb-2" />
        <Skeleton className="h-4 w-[240px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <Skeleton className="h-4 w-[60px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChartSkeleton />
        <SalesTableSkeleton />
      </div>
    </div>
  )
}