import { act, renderHook } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAdminStatus from './useAdminStatus';

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'admins/admin-user' })),
  onSnapshot: vi.fn(),
}));

describe('useAdminStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('treats a guest as a non-administrator without starting a listener', () => {
    const { result } = renderHook(() => useAdminStatus(null));

    expect(result.current).toEqual({
      isAdmin: false,
      loading: false,
      error: null,
    });
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('checks the signed-in user administrator document', () => {
    let notify: ((snapshot: { exists: () => boolean; data: () => object }) => void) | undefined;
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockImplementation((_, observer) => {
      notify = observer as typeof notify;
      return unsubscribe;
    });
    const user = { uid: 'admin-user' } as User;

    const { result, unmount } = renderHook(() => useAdminStatus(user));
    expect(result.current.loading).toBe(true);

    act(() => notify?.({ exists: () => true, data: () => ({ isAdmin: true }) }));
    expect(result.current).toMatchObject({
      isAdmin: true,
      loading: false,
      error: null,
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
