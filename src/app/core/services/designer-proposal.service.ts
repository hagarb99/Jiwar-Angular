import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { DesignerProposal, CreateDesignerProposal } from '../interfaces/designer-proposal.interface';

@Injectable({
    providedIn: 'root'
})
export class DesignerProposalService extends ApiBaseService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }


    sendProposal(data: CreateDesignerProposal): Observable<DesignerProposal> {
        return this.httpClient.post<DesignerProposal>(
            `${this.apiBaseUrl}/DesignerProposal/send`,
            data
        );
    }


    getMyProposals(): Observable<DesignerProposal[]> {
        return this.httpClient.get<DesignerProposal[]>(
            `${this.apiBaseUrl}/DesignerProposal/my`
        );
    }


    getProposalsForRequest(requestId: number): Observable<DesignerProposal[]> {
        return this.httpClient.get<DesignerProposal[]>(
            `${this.apiBaseUrl}/DesignerProposal/request/${requestId}`
        );
    }


    chooseProposal(proposalId: number): Observable<any> {
        return this.httpClient.post<any>(
            `${this.apiBaseUrl}/DesignerProposal/choose/${proposalId}`,
            {}
        );
    }


}
