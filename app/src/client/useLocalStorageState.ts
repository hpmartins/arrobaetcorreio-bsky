/**
 * tysmmmm @louislva
 * https://github.com/louislva/skyline/blob/main/helpers/hooks.ts
 */

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, boolean] {
  // First checks localStorage
  // If not found, uses defaultValue
  // Otherwise, uses the value from localStorage
  // Every time the state is set, it is also saved to localStorage

  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [state, setState] = useState<T>(defaultValue);
  useEffect(() => {
    const value = localStorage.getItem(key);
    if (value) {
      setState(JSON.parse(value));
    }
    setHasLoaded(true);
  }, []);

  const setStateAndSave = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  };

  return [state, setStateAndSave, hasLoaded];
}
