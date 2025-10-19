import React, { createContext, useContext, useMemo, useRef } from 'react';
import { DidResolver } from '@atproto/identity';
import { HabitatClient, getDefaultAgent, getUserDid } from './atproto';

interface HabitatClientContextType {
    client: HabitatClient;
    resetClient: () => void;
}

const HabitatClientContext = createContext<HabitatClientContextType | undefined>(undefined);

interface HabitatClientProviderProps {
    children: React.ReactNode;
}

/**
 * Provider component for HabitatClient.
 * This creates a singleton instance of HabitatClient that can be shared across the app.
 * The client maintains a cache of agents for different PDSs, enabling efficient
 * read-only queries to other users' PDSs.
 */
export function HabitatClientProvider({ children }: HabitatClientProviderProps) {
    // Use a ref to store the client instance so it persists across renders
    const clientRef = useRef<HabitatClient | null>(null);

    // Initialize the client once
    if (!clientRef.current) {
        try {
            const did = getUserDid();
            const agent = getDefaultAgent();
            const didResolver = new DidResolver({});
            clientRef.current = new HabitatClient(did, agent, didResolver);
        } catch (error) {
            console.error('Failed to initialize HabitatClient:', error);
            // If we can't get the DID, we'll create a client with empty values
            // This allows the app to still render, though the client won't be functional
            // until the user logs in
        }
    }

    const contextValue = useMemo(() => ({
        client: clientRef.current!,
        resetClient: () => {
            if (clientRef.current) {
                clientRef.current.reset();
            }
            // Optionally, you could also recreate the client here for logout scenarios
            // clientRef.current = null;
        },
    }), []);

    return (
        <HabitatClientContext.Provider value={contextValue}>
            {children}
        </HabitatClientContext.Provider>
    );
}

/**
 * Hook to access the HabitatClient instance.
 * Must be used within a HabitatClientProvider.
 * 
 * @returns {HabitatClientContextType} Object containing the client and resetClient function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client, resetClient } = useHabitatClient();
 *   
 *   // Query records from any PDS
 *   const records = await client.getRecord('collection', 'rkey', undefined, 'did:plc:other-user');
 *   
 *   // Reset on logout
 *   const handleLogout = () => {
 *     resetClient();
 *   };
 * }
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useHabitatClient(): HabitatClientContextType {
    const context = useContext(HabitatClientContext);
    if (!context) {
        throw new Error('useHabitatClient must be used within a HabitatClientProvider');
    }
    return context;
}

