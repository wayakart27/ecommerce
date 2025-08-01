"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DeleteIcon, PlusCircleIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { states } from "@/data/states";
import { getShippingConfig, updateShippingConfig, addStatePrice, removeStatePrice as removeSPrice, addCityPrice, removeCityPrice as removeCPrice } from "@/actions/shipping";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ShippingConfigForm() {
  const [loading, setLoading] = useState(true);
  const [statePriceModal, setStatePriceModal] = useState(false);
  const [cityPriceModal, setCityPriceModal] = useState(false);
  const [newStatePrice, setNewStatePrice] = useState({ price: 0 });
  const [newCityPrice, setNewCityPrice] = useState({ city: "", price: 0 });
  const [cities, setCities] = useState([]);
  const [editStateIndex, setEditStateIndex] = useState(null);
  const [editCityIndex, setEditCityIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("state");
  const [deleteIndex, setDeleteIndex] = useState(null);

  const form = useForm({
    defaultValues: {
      defaultPrice: 0,
      defaultDeliveryDays: 2, // Default delivery days
      freeShippingThreshold: 0,
      statePrices: [],
      cityPrices: [],
      isActive: true,
    },
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getShippingConfig();
        form.reset(config.data);
      } catch (error) {
        toast.error("Failed to load shipping configuration");
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [form]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('defaultPrice', data.defaultPrice.toString());
      formData.append('defaultDeliveryDays', data.defaultDeliveryDays.toString());
      formData.append('freeShippingThreshold', data.freeShippingThreshold?.toString() || '');
      formData.append('statePrices', JSON.stringify(data.statePrices));
      formData.append('cityPrices', JSON.stringify(data.cityPrices));
      formData.append('isActive', data.isActive.toString());
      
      await updateShippingConfig(formData);
      toast.success("Shipping configuration updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update shipping configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  // State Price Functions
  const openStateModal = (index = null) => {
    if (index !== null) {
      const prices = form.getValues("statePrices");
      setNewStatePrice(prices[index]);
      setEditStateIndex(index);
    } else {
      setNewStatePrice({ price: 0 });
      setEditStateIndex(null);
    }
    setStatePriceModal(true);
  };

  const saveStatePrice = async () => {
    if (!newStatePrice.state) return;
    
    try {
      setIsSubmitting(true);
      const priceData = {
        state: newStatePrice.state,
        price: Number(newStatePrice.price),
        deliveryDays: newStatePrice.deliveryDays ? Number(newStatePrice.deliveryDays) : undefined,
        freeShippingThreshold: newStatePrice.freeShippingThreshold 
          ? Number(newStatePrice.freeShippingThreshold) 
          : undefined
      };

      await addStatePrice(priceData);
      
      // Refresh the form data
      const updatedConfig = await getShippingConfig();
      form.reset(updatedConfig.data);
      
      setStatePriceModal(false);
      setNewStatePrice({ price: 0 });
      setEditStateIndex(null);
      toast.success("State price saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save state price");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStatePrice = (index) => {
    setDeleteType("state");
    setDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const removeStatePrice = async () => {
    if (deleteIndex === null) return;
    
    const statePrices = form.getValues("statePrices");
    const stateToRemove = statePrices[deleteIndex].state;
    
    try {
      setIsSubmitting(true);
      await removeSPrice(stateToRemove);
      
      // Refresh the form data
      const updatedConfig = await getShippingConfig();
      form.reset(updatedConfig.data);
      
      toast.success("State price removed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to remove state price");
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setDeleteIndex(null);
    }
  };

  // City Price Functions
  const openCityModal = (index = null) => {
    if (index !== null) {
      const prices = form.getValues("cityPrices");
      setNewCityPrice(prices[index]);
      setCities(states.find(s => s.state === prices[index].state)?.lgas || []);
      setEditCityIndex(index);
    } else {
      setNewCityPrice({ city: "", price: 0 });
      setEditCityIndex(null);
    }
    setCityPriceModal(true);
  };

  const saveCityPrice = async () => {
    if (!newCityPrice.state || !newCityPrice.city) return;
    
    try {
      setIsSubmitting(true);
      const priceData = {
        state: newCityPrice.state,
        city: newCityPrice.city,
        price: Number(newCityPrice.price),
        deliveryDays: newCityPrice.deliveryDays ? Number(newCityPrice.deliveryDays) : undefined,
        freeShippingThreshold: newCityPrice.freeShippingThreshold 
          ? Number(newCityPrice.freeShippingThreshold) 
          : undefined
      };

      await addCityPrice(priceData);
      
      // Refresh the form data
      const updatedConfig = await getShippingConfig();
      form.reset(updatedConfig.data);
      
      setCityPriceModal(false);
      setNewCityPrice({ city: "", price: 0 });
      setEditCityIndex(null);
      toast.success("City price saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save city price");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteCityPrice = (index) => {
    setDeleteType("city");
    setDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const removeCityPrice = async () => {
    if (deleteIndex === null) return;
    
    const cityPrices = form.getValues("cityPrices");
    const { state, city } = cityPrices[deleteIndex];
    
    try {
      setIsSubmitting(true);
      await removeCPrice(state, city);
      
      // Refresh the form data
      const updatedConfig = await getShippingConfig();
      form.reset(updatedConfig.data);
      
      toast.success("City price removed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to remove city price");
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setDeleteIndex(null);
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setNewCityPrice({ ...newCityPrice, state: selectedState });
    const selectedStateData = states.find(s => s.state === selectedState);
    setCities(selectedStateData?.lgas || []);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(value).replace('NGN', '₦');
  };

  const getDeleteMessage = () => {
    if (deleteIndex === null) return "";
    
    if (deleteType === "state") {
      const statePrices = form.getValues("statePrices");
      return `Are you sure you want to delete the shipping price for ${statePrices[deleteIndex].state}?`;
    } else {
      const cityPrices = form.getValues("cityPrices");
      return `Are you sure you want to delete the shipping price for ${cityPrices[deleteIndex].city}, ${cityPrices[deleteIndex].state}?`;
    }
  };

  return (
    <div className="relative min-h-[400px]">
      {/* Loading overlay */}
      {(loading || isSubmitting) && (
        <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Shipping Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultDeliveryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Delivery Days</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freeShippingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Shipping Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Shipping is Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* State Prices Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>State Prices</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openStateModal()}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add State Price
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery Days</TableHead>
                    <TableHead>Free Shipping Threshold</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch("statePrices")?.map((statePrice, index) => (
                    <TableRow key={`${statePrice.state}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{statePrice.state}</TableCell>
                      <TableCell>{formatCurrency(statePrice.price)}</TableCell>
                      <TableCell>{statePrice.deliveryDays || "Default"}</TableCell>
                      <TableCell>
                        {statePrice.freeShippingThreshold ? formatCurrency(statePrice.freeShippingThreshold) : "Global"}
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openStateModal(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteStatePrice(index)}
                        >
                          <DeleteIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* City Prices Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>City Prices</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openCityModal()}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add City Price
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery Days</TableHead>
                    <TableHead>Free Shipping Threshold</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch("cityPrices")?.map((cityPrice, index) => (
                    <TableRow key={`${cityPrice.state}-${cityPrice.city}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{cityPrice.state}</TableCell>
                      <TableCell>{cityPrice.city}</TableCell>
                      <TableCell>{formatCurrency(cityPrice.price)}</TableCell>
                      <TableCell>{cityPrice.deliveryDays || "Default"}</TableCell>
                      <TableCell>
                        {cityPrice.freeShippingThreshold ? formatCurrency(cityPrice.freeShippingThreshold) : "Global"}
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openCityModal(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteCityPrice(index)}
                        >
                          <DeleteIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Configuration"}
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                {getDeleteMessage()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteType === "state" ? removeStatePrice : removeCityPrice}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* State Price Modal */}
        {statePriceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editStateIndex !== null ? "Edit" : "Add"} State Price</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">State</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newStatePrice.state || ""}
                    onChange={(e) => setNewStatePrice({ ...newStatePrice, state: e.target.value })}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.state} value={state.state}>
                        {state.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Price (NGN)</label>
                  <Input
                    type="number"
                    value={newStatePrice.price}
                    onChange={(e) => setNewStatePrice({ ...newStatePrice, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Delivery Days (optional)
                  </label>
                  <Input
                    type="number"
                    value={newStatePrice.deliveryDays || ""}
                    onChange={(e) =>
                      setNewStatePrice({
                        ...newStatePrice,
                        deliveryDays: e.target.value ? e.target.value : undefined,
                      })
                    }
                    placeholder="Leave blank for default"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Free Shipping Threshold (NGN, optional)
                  </label>
                  <Input
                    type="number"
                    value={newStatePrice.freeShippingThreshold || ""}
                    onChange={(e) =>
                      setNewStatePrice({
                        ...newStatePrice,
                        freeShippingThreshold: e.target.value ? e.target.value : undefined,
                      })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatePriceModal(false);
                    setNewStatePrice({ price: 0 });
                    setEditStateIndex(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveStatePrice}
                  disabled={!newStatePrice.state || isSubmitting}
                >
                  {editStateIndex !== null ? "Update" : "Add"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* City Price Modal */}
        {cityPriceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editCityIndex !== null ? "Edit" : "Add"} City Price</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">State</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newCityPrice.state || ""}
                    onChange={handleStateChange}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.state} value={state.state}>
                        {state.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">City</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newCityPrice.city}
                    onChange={(e) => setNewCityPrice({ ...newCityPrice, city: e.target.value })}
                    disabled={!newCityPrice.state}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Price (NGN)</label>
                  <Input
                    type="number"
                    value={newCityPrice.price}
                    onChange={(e) => setNewCityPrice({ ...newCityPrice, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Delivery Days (optional)
                  </label>
                  <Input
                    type="number"
                    value={newCityPrice.deliveryDays || ""}
                    onChange={(e) =>
                      setNewCityPrice({
                        ...newCityPrice,
                        deliveryDays: e.target.value ? e.target.value : undefined,
                      })
                    }
                    placeholder="Leave blank for default"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Free Shipping Threshold (NGN, optional)
                  </label>
                  <Input
                    type="number"
                    value={newCityPrice.freeShippingThreshold || ""}
                    onChange={(e) =>
                      setNewCityPrice({
                        ...newCityPrice,
                        freeShippingThreshold: e.target.value ? e.target.value : undefined,
                      })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCityPriceModal(false);
                    setNewCityPrice({ city: "", price: 0 });
                    setEditCityIndex(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveCityPrice}
                  disabled={!newCityPrice.state || !newCityPrice.city || isSubmitting}
                >
                  {editCityIndex !== null ? "Update" : "Add"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </Form>
    </div>
  );
}