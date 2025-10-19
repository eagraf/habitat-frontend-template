# Habitat Frontend SDK

This SDK provides a client for interacting with Habitat PDSs (Personal Data Servers) and the AT Protocol.

TODO: this will be its own published package in the future.

## Features

- **Multi-PDS Support**: Query records from any PDS, not just your own
- **Automatic DID Resolution**: Automatically resolves DIDs to find the correct PDS
- **Agent Caching**: Maintains a cache of agents for different PDSs to improve performance
- **React Integration**: Provides a React provider for easy integration into React apps
- **Private Records**: Support for Habitat's private record operations

## Usage

### Setting up the Provider

Wrap your app with the `HabitatClientProvider` to make the client available throughout your component tree:

```tsx
import { HabitatClientProvider } from './sdk/HabitatClientProvider';

function App() {
  return (
    <HabitatClientProvider>
      <YourApp />
    </HabitatClientProvider>
  );
}
```

### Using the Client

Access the client in any component using the `useHabitatClient` hook:

```tsx
import { useHabitatClient } from './sdk/HabitatClientProvider';

function MyComponent() {
  const { client, resetClient } = useHabitatClient();

  // Query your own records
  const myRecords = await client.listRecords('app.bsky.feed.post');

  // Query records from another user's PDS
  const otherUserRecords = await client.listRecords(
    'app.bsky.feed.post',
    10,
    undefined,
    'did:plc:other-user-did'
  );

  // Create a record in your own repo
  const newRecord = await client.createRecord('app.bsky.feed.post', {
    text: 'Hello, world!',
    createdAt: new Date().toISOString(),
  });

  // Reset the client (useful for logout)
  const handleLogout = () => {
    resetClient();
  };
}
```

## API Reference

### HabitatClient

The main client class for interacting with Habitat PDSs.

#### Methods

- `createRecord<T>(collection, record, rkey?, opts?)`: Create a record in your own repo
- `getRecord<T>(collection, rkey, cid?, repo?, opts?)`: Get a record from any repo
- `listRecords<T>(collection, limit?, cursor?, repo?, opts?)`: List records from any repo
- `putPrivateRecord<T>(collection, record, rkey?, opts?)`: Create a private record in your own repo
- `getPrivateRecord<T>(collection, rkey, cid?, repo?, opts?)`: Get a private record from any repo
- `listPrivateRecords<T>(collection, limit?, cursor?, repo?, opts?)`: List private records from any repo
- `reset()`: Reset the client by clearing all cached agents except the default one

#### Automatic DID Resolution

When you query records from a repo you haven't queried before, the client will:
1. Check if an agent for that DID already exists in the cache
2. If not, resolve the DID using the AT Protocol DID resolver
3. Extract the PDS service endpoint from the DID document
4. Create a new agent for that PDS
5. Cache the agent for future use

This all happens automatically - you don't need to worry about managing agents yourself.

### HabitatClientProvider

React provider component that creates a singleton instance of HabitatClient.

#### Props

- `children`: React nodes to render

### useHabitatClient

React hook for accessing the HabitatClient instance.

#### Returns

- `client`: The HabitatClient instance
- `resetClient`: Function to reset the client (clears all cached agents except the default)

## Architecture

The SDK uses a multi-agent architecture:

- **Default Agent**: Connected to the user's own PDS (determined by the `did` cookie)
- **Agent Map**: A cache of agents for other PDSs, keyed by DID
- **DID Resolver**: Resolves DIDs to find PDS service endpoints

This architecture allows the client to efficiently query records from any PDS in the AT Protocol network, while maintaining a cache to avoid redundant DID resolutions.