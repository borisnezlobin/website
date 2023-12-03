import { useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      return window.localStorage.getItem(key) as T || initialValue as T;
    } catch (error) {
      console.error(error);
      return initialValue as T;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, value as string);

      localStorage.setItem(key, value as string);
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;