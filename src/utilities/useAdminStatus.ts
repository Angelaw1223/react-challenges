import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

type AdminStatus = {
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
};

type StoredAdminStatus = AdminStatus & {
  uid: string | null;
};

const useAdminStatus = (user: User | null): AdminStatus => {
  const userId = user?.uid ?? null;
  const [status, setStatus] = useState<StoredAdminStatus>({
    uid: null,
    isAdmin: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!userId) return;

    return onSnapshot(
      doc(db, 'admins', userId),
      (snapshot) => {
        setStatus({
          uid: userId,
          isAdmin: snapshot.exists() && snapshot.data().isAdmin === true,
          loading: false,
          error: null,
        });
      },
      (reason) => {
        setStatus({
          uid: userId,
          isAdmin: false,
          loading: false,
          error: reason,
        });
      },
    );
  }, [userId]);

  if (!userId) {
    return { isAdmin: false, loading: false, error: null };
  }

  if (status.uid !== userId) {
    return { isAdmin: false, loading: true, error: null };
  }

  return status;
};

export default useAdminStatus;
