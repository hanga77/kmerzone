import React, { useState, useCallback } from 'react';

export function usePersistentState<T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                const parsed = JSON.parse(storedValue);
                // Specific fix for siteSettings data migration from localStorage.
                // If the stored settings object is missing new properties,
                // merge it with the default value to prevent a crash.
                if (key === 'siteSettings' && (parsed.seo === undefined || parsed.socialLinks === undefined || !parsed.standardPlan || parsed.emailTemplates === undefined)) {
                    const defaultSettings = defaultValue as object;
                    return { ...defaultSettings, ...parsed };
                }
                return parsed;
            }
            return defaultValue;
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