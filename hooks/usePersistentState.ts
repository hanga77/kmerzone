

import { useState, useCallback } from 'react';

export function usePersistentState<T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    const setPersistentState = useCallback(
        (newValue: React.SetStateAction<T>) => {
            setState(prevState => {
                const resolvedValue = typeof newValue === 'function' 
                    ? (newValue as (prevState: T) => T)(prevState) 
                    : newValue;
                
                try {
                    window.localStorage.setItem(key, JSON.stringify(resolvedValue));
                } catch (error) {
                    console.error(`Error setting localStorage key “${key}”:`, error);
                }
                
                return resolvedValue;
            });
        },
        [key]
    );

    return [state, setPersistentState];
}