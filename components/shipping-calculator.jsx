"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Clock, MapPin } from "lucide-react"
import { calculateShippingCost } from "@/actions/shipping"

export default function ShippingCalculator({ location, orderTotal, onShippingCalculated }) {
  const [shipping, setShipping] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (location?.state && location?.city) {
      calculateShipping()
    }
  }, [location, orderTotal])

  const calculateShipping = async () => {
    if (!location) return

    setLoading(true)
    setError(null)

    try {
      const result = await calculateShippingCost(location, orderTotal)

      if (result.success) {
        setShipping(result.data)
        onShippingCalculated(result.data)
      } else {
        setError(result.error || "Failed to calculate shipping")
        // Still set fallback data
        setShipping(result.data)
        onShippingCalculated(result.data)
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Shipping calculation error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!location) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Please select a delivery address to calculate shipping</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Calculating shipping cost...</span>
          </div>
        )}

        {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

        {shipping && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{shipping.method}</p>
                <p className="text-sm text-muted-foreground">
                  To {location.city}, {location.state}
                </p>
              </div>
              <div className="text-right">
                {shipping.isFree ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    FREE
                  </Badge>
                ) : (
                  <p className="font-semibold">
                    {shipping.currency} {shipping.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {shipping.deliveryDays} {shipping.deliveryDays === 1 ? "day" : "days"} delivery
              </span>
            </div>

            <div className="text-sm">
              <p className="text-muted-foreground">Estimated delivery:</p>
              <p className="font-medium">{shipping.estimatedDelivery}</p>
            </div>

            {shipping.isFree && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">🎉 You qualify for free shipping on this order!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
