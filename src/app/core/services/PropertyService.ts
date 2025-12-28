import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";

@Injectable({ providedIn: 'root' })
export class PropertyService extends ApiBaseService {

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  addProperty(dto: any, images: File[]): Observable<any> {
   const formData = new FormData();
formData.append('title', dto.title);
formData.append('description', dto.description);
formData.append('price', dto.price.toString());
formData.append('address', dto.address);
formData.append('city', dto.city);
formData.append('listingType', dto.listingType.toString());
if(dto.district) formData.append('district', dto.district);
if(dto.area) formData.append('area', dto.area.toString());
if(dto.rooms) formData.append('rooms', dto.rooms.toString());
if(dto.bathrooms) formData.append('bathrooms', dto.bathrooms.toString());
formData.append('categoryId', dto.categoryId.toString());
if(dto.tour360Url) formData.append('tour360Url', dto.tour360Url);
if(dto.locationLat) formData.append('locationLat', dto.locationLat.toString());
if(dto.locationLang) formData.append('locationLang', dto.locationLang.toString());

images.forEach(file => formData.append('Images', file));
    return this.httpClient.post(`${this.apiBaseUrl}/property/add`, formData);
  }
}
