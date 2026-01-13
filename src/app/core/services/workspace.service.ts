import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    WorkspaceData,
    DeliverProjectRequest,
    SubmitReviewRequest,
    DesignerReviewsResponse
} from '../interfaces/workspace.interface';

@Injectable({
    providedIn: 'root'
})
export class WorkspaceService {
    private apiUrl = `${environment.apiBaseUrl}/DesignRequest`;
    private reviewApiUrl = `${environment.apiBaseUrl}/Review`;
    private proposalApiUrl = `${environment.apiBaseUrl}/DesignerProposal`;

    constructor(private http: HttpClient) { }

    /**
     * Get workspace data for a specific design request
     */
    getWorkspaceData(designRequestId: number): Observable<WorkspaceData> {
        return this.http.get<WorkspaceData>(`${this.apiUrl}/${designRequestId}/workspace`);
    }

    /**
     * Designer: Mark project as delivered
     */
    deliverProject(proposalId: number, deliveryNotes?: string): Observable<any> {
        const payload: DeliverProjectRequest = { deliveryNotes };
        return this.http.post(`${this.proposalApiUrl}/deliver/${proposalId}`, payload);
    }

    /**
     * Property Owner: Submit review for designer
     */
    submitReview(review: SubmitReviewRequest): Observable<any> {
        return this.http.post(this.reviewApiUrl, review);
    }

    /**
     * Get all reviews for a specific designer
     */
    getDesignerReviews(designerId: string): Observable<DesignerReviewsResponse> {
        return this.http.get<DesignerReviewsResponse>(`${this.reviewApiUrl}/designer/${designerId}`);
    }
}
