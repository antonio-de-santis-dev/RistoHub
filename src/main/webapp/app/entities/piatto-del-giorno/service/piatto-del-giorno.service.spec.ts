import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IPiattoDelGiorno } from '../piatto-del-giorno.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../piatto-del-giorno.test-samples';

import { PiattoDelGiornoService, RestPiattoDelGiorno } from './piatto-del-giorno.service';

const requireRestSample: RestPiattoDelGiorno = {
  ...sampleWithRequiredData,
  data: sampleWithRequiredData.data?.format(DATE_FORMAT),
};

describe('PiattoDelGiorno Service', () => {
  let service: PiattoDelGiornoService;
  let httpMock: HttpTestingController;
  let expectedResult: IPiattoDelGiorno | IPiattoDelGiorno[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(PiattoDelGiornoService);
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

    it('should create a PiattoDelGiorno', () => {
      const piattoDelGiorno = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(piattoDelGiorno).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a PiattoDelGiorno', () => {
      const piattoDelGiorno = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(piattoDelGiorno).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a PiattoDelGiorno', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of PiattoDelGiorno', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a PiattoDelGiorno', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPiattoDelGiornoToCollectionIfMissing', () => {
      it('should add a PiattoDelGiorno to an empty array', () => {
        const piattoDelGiorno: IPiattoDelGiorno = sampleWithRequiredData;
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing([], piattoDelGiorno);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(piattoDelGiorno);
      });

      it('should not add a PiattoDelGiorno to an array that contains it', () => {
        const piattoDelGiorno: IPiattoDelGiorno = sampleWithRequiredData;
        const piattoDelGiornoCollection: IPiattoDelGiorno[] = [
          {
            ...piattoDelGiorno,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing(piattoDelGiornoCollection, piattoDelGiorno);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a PiattoDelGiorno to an array that doesn't contain it", () => {
        const piattoDelGiorno: IPiattoDelGiorno = sampleWithRequiredData;
        const piattoDelGiornoCollection: IPiattoDelGiorno[] = [sampleWithPartialData];
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing(piattoDelGiornoCollection, piattoDelGiorno);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(piattoDelGiorno);
      });

      it('should add only unique PiattoDelGiorno to an array', () => {
        const piattoDelGiornoArray: IPiattoDelGiorno[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const piattoDelGiornoCollection: IPiattoDelGiorno[] = [sampleWithRequiredData];
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing(piattoDelGiornoCollection, ...piattoDelGiornoArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const piattoDelGiorno: IPiattoDelGiorno = sampleWithRequiredData;
        const piattoDelGiorno2: IPiattoDelGiorno = sampleWithPartialData;
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing([], piattoDelGiorno, piattoDelGiorno2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(piattoDelGiorno);
        expect(expectedResult).toContain(piattoDelGiorno2);
      });

      it('should accept null and undefined values', () => {
        const piattoDelGiorno: IPiattoDelGiorno = sampleWithRequiredData;
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing([], null, piattoDelGiorno, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(piattoDelGiorno);
      });

      it('should return initial array if no PiattoDelGiorno is added', () => {
        const piattoDelGiornoCollection: IPiattoDelGiorno[] = [sampleWithRequiredData];
        expectedResult = service.addPiattoDelGiornoToCollectionIfMissing(piattoDelGiornoCollection, undefined, null);
        expect(expectedResult).toEqual(piattoDelGiornoCollection);
      });
    });

    describe('comparePiattoDelGiorno', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePiattoDelGiorno(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };
        const entity2 = null;

        const compareResult1 = service.comparePiattoDelGiorno(entity1, entity2);
        const compareResult2 = service.comparePiattoDelGiorno(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };
        const entity2 = { id: 'ac00cf51-852a-479d-bda4-966132055aea' };

        const compareResult1 = service.comparePiattoDelGiorno(entity1, entity2);
        const compareResult2 = service.comparePiattoDelGiorno(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };
        const entity2 = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };

        const compareResult1 = service.comparePiattoDelGiorno(entity1, entity2);
        const compareResult2 = service.comparePiattoDelGiorno(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
