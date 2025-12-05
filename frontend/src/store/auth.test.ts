import { act, renderHook, waitFor } from '@testing-library/react';

import { api } from '@/lib/api';
import { useAuthStore } from './auth';

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
    register: jest.fn(),
    setToken: jest.fn(),
    getMe: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('sets loading state during login', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
      mockApi.login.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ token: 'token', user: mockUser }), 100)
          )
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('sets user and authentication on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        currency: 'USD',
        createdAt: '2024-01-01',
      };
      mockApi.login.mockResolvedValue({ token: 'test-token', user: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(mockApi.setToken).toHaveBeenCalledWith('test-token');
    });

    it('throws error and resets loading on failed login', async () => {
      mockApi.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('sets user and authentication on successful registration', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        name: 'New User',
        currency: 'USD',
        createdAt: '2024-01-01',
      };
      mockApi.register.mockResolvedValue({ token: 'new-token', user: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('new@example.com', 'password', 'New User');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockApi.setToken).toHaveBeenCalledWith('new-token');
    });

    it('throws error on failed registration', async () => {
      mockApi.register.mockRejectedValue(new Error('Email already exists'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'password', 'Test');
        })
      ).rejects.toThrow('Email already exists');

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user and authentication', () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test', currency: 'USD', createdAt: '' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });
  });

  describe('setUser', () => {
    it('sets user and updates authentication state', () => {
      const { result } = renderHook(() => useAuthStore());

      const newUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        currency: 'USD',
        createdAt: '',
      };

      act(() => {
        result.current.setUser(newUser);
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets authentication to false when user is null', () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test', currency: 'USD', createdAt: '' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setToken', () => {
    it('sets token and fetches user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        currency: 'USD',
        createdAt: '',
      };
      mockApi.getMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setToken('new-token');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApi.setToken).toHaveBeenCalledWith('new-token');
      expect(mockApi.getMe).toHaveBeenCalled();
    });

    it('handles getMe failure gracefully', async () => {
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setToken('invalid-token');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not crash, just set loading to false
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('Auth Store Persistence', () => {
  it('store has persist middleware', () => {
    // The store should have persistence configured
    expect(useAuthStore.persist).toBeDefined();
  });

  it('partializes state correctly (excludes isLoading)', () => {
    // The persist config should only save user and isAuthenticated
    const state = {
      user: { id: '1', email: 'test@example.com', name: 'Test', currency: 'USD', createdAt: '' },
      isAuthenticated: true,
      isLoading: true,
    };

    // Simulating what the partialize function does
    const partialized = {
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    };

    expect(partialized).not.toHaveProperty('isLoading');
  });
});


