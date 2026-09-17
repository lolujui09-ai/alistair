const AUTH_API = '/api/auth';

export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_API}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMsg = result.message || (result.errors && result.errors.join(', ')) || 'Login failed';
    throw new Error(errorMsg);
  }

  return result.data; // { user: { id, name, email, role: 'user' }, token }
}

export async function registerUser(name, email, password) {
  const response = await fetch(`${AUTH_API}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMsg = result.message || (result.errors && result.errors.join(', ')) || 'Registration failed';
    throw new Error(errorMsg);
  }

  return result.data; // { user: { id, name, email, role: 'user' }, token }
}

export async function fetchUserProfile(token) {
  const response = await fetch(`${AUTH_API}/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch user profile');
  }

  return result.data; // { id, name, email, role: 'user', ... }
}

export async function logoutUser(token) {
  try {
    if (token) {
      await fetch(`${AUTH_API}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

