// lib/api.js
const API_BASE_URL = process.env.BASE_URL;

export async function fetchUserById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/user/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

export async function fetchTwoFactorConfirmation(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/two-factor/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch 2FA confirmation:', error);
    return null;
  }
}

export async function deleteTwoFactorConfirmation(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/two-factor/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete 2FA confirmation:', error);
    return false;
  }
}