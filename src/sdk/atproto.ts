import { Agent } from '@atproto/api';
import type { ComAtprotoRepoCreateRecord, ComAtprotoRepoGetRecord, ComAtprotoRepoListRecords } from '@atproto/api';
import Cookies from 'js-cookie';

// Types for Habitat private record operations
export interface PutRecordRequest {
    collection: string;
    repo: string;
    rkey?: string;
    record: Record<string, unknown>;
}

export interface GetRecordQueryParams {
    collection: string;
    rkey: string;
    repo: string;
}

export interface PutRecordResponse {
    uri: string;
    cid: string;
}

export interface GetRecordResponse {
    uri: string;
    cid: string;
    value: Record<string, unknown>;
}

export interface ListRecordsQueryParams {
    collection: string;
    repo: string;
    limit?: number;
    cursor?: string;
}

export interface ListRecordsResponse {
    records: Array<{
        uri: string;
        cid: string;
        value: Record<string, unknown>;
    }>;
    cursor?: string;
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

    createRecord(
        data: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'repo'>,
        opts?: ComAtprotoRepoCreateRecord.CallOptions,
    ): Promise<ComAtprotoRepoCreateRecord.Response> {
        return this.agent.com.atproto.repo.createRecord({
            ...data,
            repo: this.did,
        }, opts);
    }

    getRecord(
        params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'repo'>,
        opts?: ComAtprotoRepoGetRecord.CallOptions,
    ): Promise<ComAtprotoRepoGetRecord.Response> {
        return this.agent.com.atproto.repo.getRecord({
            ...params,
            repo: this.did,
        }, opts);
    }

    listRecords(
        params: Omit<ComAtprotoRepoListRecords.QueryParams, 'repo'>,
        opts?: ComAtprotoRepoListRecords.CallOptions,
    ): Promise<ComAtprotoRepoListRecords.Response> {
        return this.agent.com.atproto.repo.listRecords({
            ...params,
            repo: this.did,
        }, opts);
    }

    async putPrivateRecord(
        data: Omit<PutRecordRequest, 'repo'>,
        opts?: RequestInit,
    ): Promise<PutRecordResponse> {
        const requestBody: PutRecordRequest = {
            ...data,
            repo: this.did,
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

    async getPrivateRecord(
        params: Omit<GetRecordQueryParams, 'repo'>,
        opts?: RequestInit,
    ): Promise<GetRecordResponse> {
        const queryParams = new URLSearchParams({
            ...params,
            repo: this.did,
        });

        const response = await this.agent.fetchHandler(`/xrpc/com.habitat.getRecord?${queryParams}`, {
            method: 'GET',
            ...opts,
        });

        if (!response.ok) {
            throw new Error(`Failed to get private record: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async listPrivateRecords(
        params: Omit<ListRecordsQueryParams, 'repo'>,
        opts?: RequestInit,
    ): Promise<ListRecordsResponse> {
        const queryParams = new URLSearchParams();
        queryParams.set('collection', params.collection);
        queryParams.set('repo', this.did);
        
        if (params.limit !== undefined) {
            queryParams.set('limit', params.limit.toString());
        }
        if (params.cursor) {
            queryParams.set('cursor', params.cursor);
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
