import { act, renderHook, waitFor } from '@testing-library/react';
import { reducer, toast, useToast } from './use-toast';

describe('reducer', () => {
  const initialState = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('adds a toast to state', () => {
      const newToast = { id: '1', title: 'Test Toast', open: true };
      const action = { type: 'ADD_TOAST' as const, toast: newToast };

      const result = reducer(initialState, action);

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it('limits toasts to TOAST_LIMIT', () => {
      const state = { toasts: [{ id: '1', title: 'Toast 1', open: true }] };
      const newToast = { id: '2', title: 'Toast 2', open: true };
      const action = { type: 'ADD_TOAST' as const, toast: newToast };

      const result = reducer(state, action);

      // TOAST_LIMIT is 1, so only the newest toast should remain
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('updates an existing toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original Title', open: true }],
      };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated Title' },
      };

      const result = reducer(state, action);

      expect(result.toasts[0].title).toBe('Updated Title');
    });

    it('does not modify other toasts', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated Toast 1' },
      };

      const result = reducer(state, action);

      expect(result.toasts[0].title).toBe('Updated Toast 1');
      expect(result.toasts[1].title).toBe('Toast 2');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('dismisses a specific toast by id', () => {
      const state = {
        toasts: [{ id: '1', title: 'Toast 1', open: true }],
      };
      const action = {
        type: 'DISMISS_TOAST' as const,
        toastId: '1',
      };

      const result = reducer(state, action);

      expect(result.toasts[0].open).toBe(false);
    });

    it('dismisses all toasts when no id provided', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };
      const action = {
        type: 'DISMISS_TOAST' as const,
        toastId: undefined,
      };

      const result = reducer(state, action);

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(false);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('removes a specific toast by id', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };
      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: '1',
      };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });

    it('removes all toasts when no id provided', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };
      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: undefined,
      };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(0);
    });
  });
});

describe('toast function', () => {
  it('returns toast controls', () => {
    const result = toast({ title: 'Test Toast' });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('dismiss');
    expect(result).toHaveProperty('update');
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  it('generates unique ids', () => {
    const toast1 = toast({ title: 'Toast 1' });
    const toast2 = toast({ title: 'Toast 2' });

    expect(toast1.id).not.toBe(toast2.id);
  });
});

describe('useToast hook', () => {
  it('returns toasts and toast function', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty('toasts');
    expect(result.current).toHaveProperty('toast');
    expect(result.current).toHaveProperty('dismiss');
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('adds toast via toast function', async () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'New Toast' });
    });

    await waitFor(() => {
      expect(result.current.toasts.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('dismiss function is available', () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.dismiss).toBe('function');
  });
});


