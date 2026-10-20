import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

type FirestoreDocumentResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

const useFirestoreDocument = <T,>(path: string): FirestoreDocumentResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, path),
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
          setError(null);
        } else {
          setData(null);
          setError(new Error('Course schedule not found'));
        }
        setLoading(false);
      },
      (reason) => {
        setData(null);
        setError(reason);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [path]);

  return { data, loading, error };
};

export default useFirestoreDocument;
