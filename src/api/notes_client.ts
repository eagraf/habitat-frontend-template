import { HabitatClient, getUserDid, getDefaultAgent } from '../sdk/atproto';

export const createNoteRecord = async (note: string) => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.createRecord({
        collection: 'dev.eagraf.note',
        record: {
            note,
        },
    });
    return response.data;
};

export const listNotes = async () => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.listRecords({
        collection: 'dev.eagraf.note',
    });
    return response.data;
};


// Convenience functions for private record operations
export const putPrivateNoteRecord = async (note: string, rkey?: string) => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.putPrivateRecord({
        collection: 'dev.eagraf.note',
        rkey,
        record: {
            note,
        },
    });
    return response;
};

export const getPrivateNoteRecord = async (rkey: string) => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.getPrivateRecord({
        collection: 'dev.eagraf.note',
        rkey,
    });
    return response;
};

export const listPrivateNotes = async () => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.listPrivateRecords({
        collection: 'dev.eagraf.note',
    });
    console.log(response);
    return response;
};
