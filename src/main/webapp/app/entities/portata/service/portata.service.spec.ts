import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IPortata } from '../portata.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../portata.test-samples';

import { PortataService } from './portata.service';

const requireRestSample: IPortata = {
  ...sampleWithRequiredData,
};

describe('Portata Service', () => {
  let service: PortataService;
  let httpMock: HttpTestingController;
  let expectedResult: IPortata | IPortata[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(PortataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Portata', () => {
      const portata = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(portata).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Portata', () => {
      const portata = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(portata).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Portata', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Portata', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Portata', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPortataToCollectionIfMissing', () => {
      it('should add a Portata to an empty array', () => {
        const portata: IPortata = sampleWithRequiredData;
        expectedResult = service.addPortataToCollectionIfMissing([], portata);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(portata);
      });

      it('should not add a Portata to an array that contains it', () => {
        const portata: IPortata = sampleWithRequiredData;
        const portataCollection: IPortata[] = [
          {
            ...portata,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPortataToCollectionIfMissing(portataCollection, portata);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Portata to an array that doesn't contain it", () => {
        const portata: IPortata = sampleWithRequiredData;
        const portataCollection: IPortata[] = [sampleWithPartialData];
        expectedResult = service.addPortataToCollectionIfMissing(portataCollection, portata);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(portata);
      });

      it('should add only unique Portata to an array', () => {
        const portataArray: IPortata[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const portataCollection: IPortata[] = [sampleWithRequiredData];
        expectedResult = service.addPortataToCollectionIfMissing(portataCollection, ...portataArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const portata: IPortata = sampleWithRequiredData;
        const portata2: IPortata = sampleWithPartialData;
        expectedResult = service.addPortataToCollectionIfMissing([], portata, portata2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(portata);
        expect(expectedResult).toContain(portata2);
      });

      it('should accept null and undefined values', () => {
        const portata: IPortata = sampleWithRequiredData;
        expectedResult = service.addPortataToCollectionIfMissing([], null, portata, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(portata);
      });

      it('should return initial array if no Portata is added', () => {
        const portataCollection: IPortata[] = [sampleWithRequiredData];
        expectedResult = service.addPortataToCollectionIfMissing(portataCollection, undefined, null);
        expect(expectedResult).toEqual(portataCollection);
      });
    });

    describe('comparePortata', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePortata(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };
        const entity2 = null;

        const compareResult1 = service.comparePortata(entity1, entity2);
        const compareResult2 = service.comparePortata(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };
        const entity2 = { id: '74e304a1-0b28-441d-84dc-26fb6eaa1cab' };

        const compareResult1 = service.comparePortata(entity1, entity2);
        const compareResult2 = service.comparePortata(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };
        const entity2 = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };

        const compareResult1 = service.comparePortata(entity1, entity2);
        const compareResult2 = service.comparePortata(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
