import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export abstract class ApiBaseService {
    protected readonly apiBaseUrl: string = environment.apiBaseUrl;
    constructor(protected httpClient: HttpClient) {}
}