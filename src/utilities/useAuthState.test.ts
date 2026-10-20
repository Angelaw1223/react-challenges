import { act, renderHook } from '@testing-library/react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAuthState from './useAuthState';

vi.mock('../firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({ onAuthStateChanged: vi.fn() }));

describe('useAuthState', () => {
  beforeEach(() => vi.clearAllMocks());

  it('waits for Firebase and follows later authentication changes', () => {
    let notify: ((user: User | null) => void) | undefined;
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation((_, observer) => {
      notify = observer as (user: User | null) => void;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useAuthState());
    expect(result.current).toEqual({ user: null, loading: true });

    const user = { displayName: 'Angela Wan' } as User;
    act(() => notify?.(user));
    expect(result.current).toEqual({ user, loading: false });

    act(() => notify?.(null));
    expect(result.current).toEqual({ user: null, loading: false });

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
