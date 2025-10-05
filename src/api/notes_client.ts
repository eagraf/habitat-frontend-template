import { HabitatClient, getUserDid, getDefaultAgent } from '../sdk/atproto';

// Note record type
export interface NoteRecord {
    note: string;
    createdAt?: string;
}

export const createNoteRecord = async (note: string) => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.createRecord<NoteRecord>({
        collection: 'dev.eagraf.note',
        record: {
            note,
        },
    });
    return response.data;
};

export const listNotes = async () => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.listRecords<NoteRecord>({
        collection: 'dev.eagraf.note',
    });
    return response.data;
};


// Convenience functions for private record operations
export const putPrivateNoteRecord = async (note: string, rkey?: string) => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.putPrivateRecord<NoteRecord>({
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
    const response = await client.getPrivateRecord<NoteRecord>({
        collection: 'dev.eagraf.note',
        rkey,
    });
    return response;
};

export const listPrivateNotes = async () => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent());
    const response = await client.listPrivateRecords<NoteRecord>({
        collection: 'dev.eagraf.note',
    });
    console.log(response);
    return response;
};
