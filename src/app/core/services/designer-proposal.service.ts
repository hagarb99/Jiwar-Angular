import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from './api-base.service';
import { Observable, map } from 'rxjs';
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
        return this.httpClient.get<any[]>(
            `${this.apiBaseUrl}/DesignerProposal/my`
        ).pipe(
            map(data => data.map(p => this.normalizeProposal(p)))
        );
    }

    getProposalsForRequest(requestId: number): Observable<DesignerProposal[]> {
        return this.httpClient.get<any[]>(
            `${this.apiBaseUrl}/DesignerProposal/request/${requestId}`
        ).pipe(
            map(data => data.map(p => this.normalizeProposal(p)))
        );
    }

    private mapStatus(val: any): number {
        if (val === undefined || val === null) return 0;

        let statusVal = val;
        if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
            statusVal = Number(val);
        }

        if (typeof statusVal === 'number') return statusVal;

        if (typeof statusVal === 'string') {
            const lower = statusVal.toLowerCase().trim();
            if (lower === 'accepted' || lower === 'approved' || lower === 'chosen' || lower === 'selected' || lower === 'inprogress' || lower === 'active') {
                return 1;
            }
            if (lower === 'rejected' || lower === 'declined' || lower === 'cancelled') {
                return 2;
            }
            if (lower === 'completed' || lower === 'finished' || lower === 'done') {
                return 3;
            }
        }
        return 0; // Default to Pending
    }

    private normalizeProposal(p: any): DesignerProposal {
        console.debug('Raw proposal data from API:', p);
        const rawStatus = p.status ?? p.Status ?? p.proposalStatus ?? p.ProposalStatus ?? p.offerStatus ?? p.OfferStatus ?? p.Proposal_Status ?? p.proposal_status ?? 0;

        const normalized = {
            id: p.id || p.Id || p.proposalID || p.ProposalID || p.idProposal,
            designRequestID: p.designRequestID || p.DesignRequestID || p.requestID || p.RequestID || p.requestId || p.idRequest,
            proposalDescription: p.proposalDescription || p.ProposalDescription || p.description || p.Description || p.offerDetails || p.notes,
            estimatedCost: p.estimatedCost ?? p.EstimatedCost ?? p.price ?? p.Price ?? p.cost ?? p.budget ?? 0,
            estimatedDays: p.estimatedDays ?? p.EstimatedDays ?? p.duration ?? p.Duration ?? p.days ?? 0,
            sampleDesignURL: p.sampleDesignURL || p.SampleDesignURL || p.SampleDesignUrl || p.sampleUrl || p.imageUrl,
            status: this.mapStatus(rawStatus),
            designerName: p.designerName || p.DesignerName || p.designer_name,
            designerEmail: p.designerEmail || p.DesignerEmail || p.designer_email
        };

        console.debug('Normalized proposal:', normalized);
        return normalized;
    }


    chooseProposal(proposalId: number): Observable<DesignerProposal[]> {
        return this.httpClient.post<any[]>(
            `${this.apiBaseUrl}/DesignerProposal/choose/${proposalId}`,
            {}
        ).pipe(
            map(data => Array.isArray(data) ? data.map(p => this.normalizeProposal(p)) : [])
        );
    }

    rejectProposal(proposalId: number): Observable<DesignerProposal[]> {
        return this.httpClient.post<any[]>(
            `${this.apiBaseUrl}/DesignerProposal/reject/${proposalId}`,
            {}
        ).pipe(
            map(data => Array.isArray(data) ? data.map(p => this.normalizeProposal(p)) : [])
        );
    }


}
