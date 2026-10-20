import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useFirestoreDocument from './useFirestoreDocument';

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(() => 'schedule-reference'),
  onSnapshot: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: firestoreMocks.doc,
  onSnapshot: firestoreMocks.onSnapshot,
}));

describe('useFirestoreDocument', () => {
  beforeEach(() => {
    firestoreMocks.doc.mockClear();
    firestoreMocks.onSnapshot.mockReset();
    firestoreMocks.unsubscribe.mockClear();
  });

  it('updates from a snapshot and unsubscribes when unmounted', async () => {
    let sendSnapshot: ((snapshot: unknown) => void) | undefined;
    firestoreMocks.onSnapshot.mockImplementation(
      (_reference, nextSnapshot) => {
        sendSnapshot = nextSnapshot;
        return firestoreMocks.unsubscribe;
      },
    );

    const { result, unmount } = renderHook(() =>
      useFirestoreDocument<{ title: string }>('schedules/CS-2018-2019'),
    );

    act(() => {
      sendSnapshot?.({
        exists: () => true,
        data: () => ({ title: 'Computer Science Courses' }),
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.title).toBe('Computer Science Courses');

    unmount();
    expect(firestoreMocks.unsubscribe).toHaveBeenCalledOnce();
  });
});
