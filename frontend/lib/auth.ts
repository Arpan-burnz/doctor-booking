'use client';

export const saveTokens = (accessToken: string, refreshToken: string, user?: { email?: string; role?: string }) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  if (user?.email) {
    localStorage.setItem('userEmail', user.email);
  }
  localStorage.setItem('patient-dashboard-theme', 'dark');
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
};

export const clearTokens = () => {
  localStorage.clear();
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getUserEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userEmail');
};

export const getUsername = (): string => {
  if (typeof window === 'undefined') return 'User';

  const savedProfile = localStorage.getItem('doc4u_patient_profile');
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);
      if (parsed.fullName && parsed.fullName !== 'Arpan') {
        return parsed.fullName;
      }
    } catch (e) {}
  }

  const userEmail = localStorage.getItem('userEmail');
  if (userEmail) {
    const rawName = userEmail.split('@')[0];
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }

  return 'User';
};

export const getUserRole = (): string | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getToken();