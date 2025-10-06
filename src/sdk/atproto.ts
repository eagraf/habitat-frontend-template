import { Agent } from '@atproto/api';
import type { ComAtprotoRepoCreateRecord, ComAtprotoRepoGetRecord, ComAtprotoRepoListRecords } from '@atproto/api';
import Cookies from 'js-cookie';

// Response types for HabitatClient
export interface CreateRecordResponse {
    uri: string;
    cid: string;
}

export interface GetRecordResponse<T = Record<string, unknown>> {
    uri: string;
    cid?: string;
    value: T;
}

export interface ListRecordsResponse<T = Record<string, unknown>> {
    records: Array<{
        uri: string;
        cid: string;
        value: T;
    }>;
    cursor?: string;
}

// Internal types for Habitat private record operations
// These include 'repo' since they're used in the wire protocol
interface PutRecordRequest<T = Record<string, unknown>> {
    collection: string;
    repo: string;
    rkey?: string;
    record: T;
}

// HabitatAgentSession implements the Atproto Session interface.
export class HabitatAgentSession {

    host: string;

    constructor(host: string) {
        this.host = host;
    }

    async fetchHandler(pathname: string, init?: RequestInit): Promise<Response> {
        const fetchReq = new Request(`https://${this.host}${pathname}`, init);

        const response = await fetch(fetchReq);
        return response;
    }

}

export const getDefaultAgent = (): Agent => {
    return getAgent(window.location.hostname);
}

// TODO: Implement proper agent creation when @atproto/api is available
export const getAgent = (host: string): Agent => {
    const session = new HabitatAgentSession(host);
    const agent = new Agent(session);
    return agent;
}

export const getUserDid = (): string => {
    const cookie = Cookies.get('did');
    if (!cookie) {
        throw new Error('No did cookie found');
    }
    return cookie;
}

export class HabitatClient {
    private did: string;
    private agent: Agent;

    constructor(did: string, agent: Agent) {
        this.did = did;
        this.agent = agent;
    }

    async createRecord<T = Record<string, unknown>>(
        collection: string,
        record: T,
        rkey?: string,
        opts?: ComAtprotoRepoCreateRecord.CallOptions,
    ): Promise<CreateRecordResponse> {
        const response = await this.agent.com.atproto.repo.createRecord({
            repo: this.did,
            collection,
            record: record as Record<string, unknown>,
            rkey,
        }, opts);
        
        return {
            uri: response.data.uri,
            cid: response.data.cid,
        };
    }

    async getRecord<T = Record<string, unknown>>(
        collection: string,
        rkey: string,
        cid?: string,
        opts?: ComAtprotoRepoGetRecord.CallOptions,
    ): Promise<GetRecordResponse<T>> {
        const response = await this.agent.com.atproto.repo.getRecord({
            repo: this.did,
            collection,
            rkey,
            cid,
        }, opts);
        
        return {
            uri: response.data.uri,
            cid: response.data.cid,
            value: response.data.value as T,
        };
    }

    async listRecords<T = Record<string, unknown>>(
        collection: string,
        limit?: number,
        cursor?: string,
        opts?: ComAtprotoRepoListRecords.CallOptions,
    ): Promise<ListRecordsResponse<T>> {
        const response = await this.agent.com.atproto.repo.listRecords({
            repo: this.did,
            collection,
            limit,
            cursor,
        }, opts);
        
        return {
            records: response.data.records.map(record => ({
                uri: record.uri,
                cid: record.cid,
                value: record.value as T,
            })),
            cursor: response.data.cursor,
        };
    }

    async putPrivateRecord<T = Record<string, unknown>>(
        collection: string,
        record: T,
        rkey?: string,
        opts?: RequestInit,
    ): Promise<CreateRecordResponse> {
        const requestBody: PutRecordRequest<T> = {
            repo: this.did,
            collection,
            rkey,
            record,
        };

        const response = await this.agent.fetchHandler('/xrpc/com.habitat.putRecord', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            ...opts,
        });

        if (!response.ok) {
            throw new Error(`Failed to put private record: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getPrivateRecord<T = Record<string, unknown>>(
        collection: string,
        rkey: string,
        cid?: string,
        opts?: RequestInit,
    ): Promise<GetRecordResponse<T>> {
        const queryParams = new URLSearchParams({
            repo: this.did,
            collection,
            rkey,
        });

        if (cid) {
            queryParams.set('cid', cid);
        }

        const response = await this.agent.fetchHandler(`/xrpc/com.habitat.getRecord?${queryParams}`, {
            method: 'GET',
            ...opts,
        });

        if (!response.ok) {
            throw new Error(`Failed to get private record: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async listPrivateRecords<T = Record<string, unknown>>(
        collection: string,
        limit?: number,
        cursor?: string,
        opts?: RequestInit,
    ): Promise<ListRecordsResponse<T>> {
        const queryParams = new URLSearchParams();
        queryParams.set('collection', collection);
        queryParams.set('repo', this.did);
        
        if (limit !== undefined) {
            queryParams.set('limit', limit.toString());
        }
        if (cursor) {
            queryParams.set('cursor', cursor);
        }

        const response = await this.agent.fetchHandler(`/xrpc/com.habitat.listRecords?${queryParams}`, {
            method: 'GET',
            ...opts,
        });

        if (!response.ok) {
            throw new Error(`Failed to list private records: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }
}
