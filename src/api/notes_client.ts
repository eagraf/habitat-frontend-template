import { DidResolver } from '@atproto/identity';
import { HabitatClient, getUserDid, getDefaultAgent } from '../sdk/atproto';
import type { CreateRecordResponse, GetRecordResponse, ListRecordsResponse } from '../sdk/atproto';

// Note record type
export interface NoteRecord {
    note: string;
    createdAt?: string;
}

export const createNoteRecord = async (note: string): Promise<CreateRecordResponse> => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent(), new DidResolver({}));
    const response = await client.createRecord<NoteRecord>(
        'dev.eagraf.note',
        { note }
    );
    return response;
};

export const listNotes = async (repo?: string): Promise<ListRecordsResponse<NoteRecord>> => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent(), new DidResolver({}));
    const response = await client.listRecords<NoteRecord>('dev.eagraf.note', undefined, undefined, repo);
    return response;
};


// Convenience functions for private record operations
export const putPrivateNoteRecord = async (note: string, rkey?: string): Promise<CreateRecordResponse> => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent(), new DidResolver({}));
    const response = await client.putPrivateRecord<NoteRecord>(
        'dev.eagraf.note',
        { note },
        rkey
    );
    return response;
};

export const getPrivateNoteRecord = async (rkey: string, repo?: string): Promise<GetRecordResponse<NoteRecord>> => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent(), new DidResolver({}));
    const response = await client.getPrivateRecord<NoteRecord>(
        'dev.eagraf.note',
        rkey,
        undefined,
        repo
    );
    return response;
};

export const listPrivateNotes = async (repo?: string): Promise<ListRecordsResponse<NoteRecord>> => {
    const client = new HabitatClient(getUserDid(), getDefaultAgent(), new DidResolver({}));
    const response = await client.listPrivateRecords<NoteRecord>('dev.eagraf.note', undefined, undefined, repo);
    console.log(response);
    return response;
};
