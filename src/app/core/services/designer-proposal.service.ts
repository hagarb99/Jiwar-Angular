import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Imported HttpClient
import { ApiBaseService } from './api-base.service';
import { DesignerProposalDto, ProposalForOwnerDto } from '../models/designer-proposal.dto';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DesignerProposalService extends ApiBaseService {

    // Explicit constructor to avoid inheritance issues
    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    getMyProposals(): Observable<DesignerProposalDto[]> {
        return this.httpClient.get<DesignerProposalDto[]>(`/api/DesignerProposal/my`);
    }

    sendProposal(proposal: DesignerProposalDto): Observable<DesignerProposalDto> {
        return this.httpClient.post<DesignerProposalDto>(`/api/DesignerProposal/send`, proposal);
    }

    getProposalsForRequest(requestId: number): Observable<ProposalForOwnerDto[]> {
        return this.httpClient.get<ProposalForOwnerDto[]>(`/api/DesignerProposal/request/${requestId}`);
    }
}
