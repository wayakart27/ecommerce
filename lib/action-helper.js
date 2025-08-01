export function prepareFormData(formData) {
  return {
    defaultPrice: Number(formData.get('defaultPrice')),
    freeShippingThreshold: formData.get('freeShippingThreshold') 
      ? Number(formData.get('freeShippingThreshold')) 
      : undefined,
    statePrices: JSON.parse(formData.get('statePrices') || '[]'),
    cityPrices: JSON.parse(formData.get('cityPrices') || '[]'),
    isActive: formData.get('isActive') === 'on'
  };
}

export function handleActionError(error) {
  console.error('Action error:', error);
  return {
    error: error.message || 'An error occurred',
    status: 'error'
  };
}