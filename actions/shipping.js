'use server';

import { revalidatePath } from 'next/cache';
import { states } from '@/data/states';
import dbConnect from '@/lib/mongodb';
import Shipping from '@/model/Shipping';
import { cache } from 'react';

function serializeConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

const isValidState = (state) => {
  return states.some(s => s.state === state);
};

const isValidCity = (state, city) => {
  const stateData = states.find(s => s.state === state);
  return stateData ? stateData.lgas.includes(city) : false;
};

export const getShippingConfig = cache(async () => {
  try {
    await dbConnect();
    let config = await Shipping.findOne({});
    
    if (!config) {
      config = new Shipping({
        defaultPrice: 1500,
        defaultDeliveryDays: 2, // NEW: Added default delivery days
        freeShippingThreshold: 20000,
        statePrices: [],
        cityPrices: [],
        isActive: true
      });
      await config.save();
    }

    const configData = config.toObject({
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.__v;
        return ret;
      }
    });

    return {
      success: true,
      data: configData,
      message: 'Shipping configuration loaded successfully'
    };
  } catch (error) {
    console.error('Failed to fetch shipping config:', error);
    return {
      success: false,
      error: 'Failed to fetch shipping configuration',
      details: error.message
    };
  }
});

export async function revalidateShippingConfig() {
  const { unstable_cache } = await import('next/cache');
  await unstable_cache.clear('shipping-config');
}

export async function updateShippingConfig(formData) {
  try {
    await dbConnect();
    
    const rawData = {
      defaultPrice: Number(formData.get('defaultPrice')),
      defaultDeliveryDays: Number(formData.get('defaultDeliveryDays')), // NEW: Added
      freeShippingThreshold: formData.get('freeShippingThreshold') 
        ? Number(formData.get('freeShippingThreshold')) 
        : undefined,
      statePrices: JSON.parse(formData.get('statePrices')),
      cityPrices: JSON.parse(formData.get('cityPrices')),
      isActive: formData.get('isActive')
    };

    // Validate state prices
    for (const statePrice of rawData.statePrices) {
      if (!isValidState(statePrice.state)) {
        throw new Error(`Invalid state: ${statePrice.state}`);
      }
    }

    // Validate city prices
    for (const cityPrice of rawData.cityPrices) {
      if (!isValidState(cityPrice.state)) {
        throw new Error(`Invalid state: ${cityPrice.state}`);
      }
      if (!isValidCity(cityPrice.state, cityPrice.city)) {
        throw new Error(`Invalid city ${cityPrice.city} for state ${cityPrice.state}`);
      }
    }

    const updatedConfig = await Shipping.findOneAndUpdate(
      {},
      { $set: rawData },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/shipping');
    return {
      success: true,
      data: serializeConfig(updatedConfig),
      message: 'Shipping configuration updated successfully'
    };
  } catch (error) {
    console.error('Failed to update shipping config:', error);
    return {
      success: false,
      error: 'Failed to update shipping configuration',
      details: error.message
    };
  }
}

export async function addStatePrice(statePriceData) {

  try {
    await dbConnect();
    
    if (!isValidState(statePriceData.state)) {
      throw new Error(`Invalid state: ${statePriceData.state}`);
    }

    const config = await Shipping.findOne({});
    if (!config) {
      throw new Error('Shipping configuration not found');
    }

    const existingIndex = config.statePrices.findIndex(
      sp => sp.state === statePriceData.state
    );

    // NEW: Add delivery days to state price
    const newStatePrice = {
      state: statePriceData.state,
      price: Number(statePriceData.price),
      deliveryDays: statePriceData.deliveryDays 
        ? Number(statePriceData.deliveryDays) 
        : undefined,
      freeShippingThreshold: statePriceData.freeShippingThreshold 
        ? Number(statePriceData.freeShippingThreshold) 
        : undefined
    };

    if (existingIndex >= 0) {
      config.statePrices[existingIndex] = newStatePrice;
    } else {
      config.statePrices.push(newStatePrice);
    }

    await config.save();
    revalidatePath('/admin/shipping');
    return {
      success: true,
      data: serializeConfig(config),
      message: 'State price added successfully'
    };
  } catch (error) {
    console.error('Failed to add state price:', error);
    return {
      success: false,
      error: 'Failed to add state price',
      details: error.message
    };
  }
}

export async function removeStatePrice(state) {
  try {
    await dbConnect();
    
    const config = await Shipping.findOne({});
    if (!config) {
      throw new Error('Shipping configuration not found');
    }

    config.statePrices = config.statePrices.filter(
      sp => sp.state !== state
    );

    await config.save();
    revalidatePath('/admin/shipping');
    return {
      success: true,
      data: serializeConfig(config),
      message: 'State price removed successfully'
    };
  } catch (error) {
    console.error('Failed to remove state price:', error);
    return {
      success: false,
      error: 'Failed to remove state price',
      details: error.message
    };
  }
}

export async function addCityPrice(cityPriceData) {
  try {
    await dbConnect();
    
    if (!isValidState(cityPriceData.state)) {
      throw new Error(`Invalid state: ${cityPriceData.state}`);
    }
    if (!isValidCity(cityPriceData.state, cityPriceData.city)) {
      throw new Error(`Invalid city ${cityPriceData.city} for state ${cityPriceData.state}`);
    }

    const config = await Shipping.findOne({});
    if (!config) {
      throw new Error('Shipping configuration not found');
    }

    const existingIndex = config.cityPrices.findIndex(
      cp => cp.state === cityPriceData.state && cp.city === cityPriceData.city
    );

    // NEW: Add delivery days to city price
    const newCityPrice = {
      state: cityPriceData.state,
      city: cityPriceData.city,
      price: Number(cityPriceData.price),
      deliveryDays: cityPriceData.deliveryDays 
        ? Number(cityPriceData.deliveryDays) 
        : undefined,
      freeShippingThreshold: cityPriceData.freeShippingThreshold 
        ? Number(cityPriceData.freeShippingThreshold) 
        : undefined
    };

    if (existingIndex >= 0) {
      config.cityPrices[existingIndex] = newCityPrice;
    } else {
      config.cityPrices.push(newCityPrice);
    }

    await config.save();
    revalidatePath('/admin/shipping');
    return {
      success: true,
      data: serializeConfig(config),
      message: 'City price added successfully'
    };
  } catch (error) {
    console.error('Failed to add city price:', error);
    return {
      success: false,
      error: 'Failed to add city price',
      details: error.message
    };
  }
}

export async function removeCityPrice(state, city) {
  try {
    await dbConnect();
    
    const config = await Shipping.findOne({});
    if (!config) {
      throw new Error('Shipping configuration not found');
    }

    config.cityPrices = config.cityPrices.filter(
      cp => !(cp.state === state && cp.city === city)
    );

    await config.save();
    revalidatePath('/admin/shipping');
    return {
      success: true,
      data: serializeConfig(config),
      message: 'City price removed successfully'
    };
  } catch (error) {
    console.error('Failed to remove city price:', error);
    return {
      success: false,
      error: 'Failed to remove city price',
      details: error.message
    };
  }
}

export async function calculateShipping(location, orderTotal = 0) {
  try {
    await dbConnect();
    const result = await Shipping.calculateNigeriaShipping(location, orderTotal);
    return {
      success: true,
      data: serializeConfig(result),
      message: 'Shipping cost calculated successfully'
    };
  } catch (error) {
    console.error('Failed to calculate shipping:', error);
    return {
      success: false,
      error: 'Failed to calculate shipping',
      details: error.message
    };
  }
}