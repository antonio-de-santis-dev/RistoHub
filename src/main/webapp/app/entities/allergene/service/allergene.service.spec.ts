import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IAllergene } from '../allergene.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../allergene.test-samples';

import { AllergeneService } from './allergene.service';

const requireRestSample: IAllergene = {
  ...sampleWithRequiredData,
};

describe('Allergene Service', () => {
  let service: AllergeneService;
  let httpMock: HttpTestingController;
  let expectedResult: IAllergene | IAllergene[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(AllergeneService);
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

    it('should create a Allergene', () => {
      const allergene = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(allergene).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Allergene', () => {
      const allergene = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(allergene).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Allergene', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Allergene', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Allergene', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addAllergeneToCollectionIfMissing', () => {
      it('should add a Allergene to an empty array', () => {
        const allergene: IAllergene = sampleWithRequiredData;
        expectedResult = service.addAllergeneToCollectionIfMissing([], allergene);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(allergene);
      });

      it('should not add a Allergene to an array that contains it', () => {
        const allergene: IAllergene = sampleWithRequiredData;
        const allergeneCollection: IAllergene[] = [
          {
            ...allergene,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addAllergeneToCollectionIfMissing(allergeneCollection, allergene);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Allergene to an array that doesn't contain it", () => {
        const allergene: IAllergene = sampleWithRequiredData;
        const allergeneCollection: IAllergene[] = [sampleWithPartialData];
        expectedResult = service.addAllergeneToCollectionIfMissing(allergeneCollection, allergene);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(allergene);
      });

      it('should add only unique Allergene to an array', () => {
        const allergeneArray: IAllergene[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const allergeneCollection: IAllergene[] = [sampleWithRequiredData];
        expectedResult = service.addAllergeneToCollectionIfMissing(allergeneCollection, ...allergeneArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const allergene: IAllergene = sampleWithRequiredData;
        const allergene2: IAllergene = sampleWithPartialData;
        expectedResult = service.addAllergeneToCollectionIfMissing([], allergene, allergene2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(allergene);
        expect(expectedResult).toContain(allergene2);
      });

      it('should accept null and undefined values', () => {
        const allergene: IAllergene = sampleWithRequiredData;
        expectedResult = service.addAllergeneToCollectionIfMissing([], null, allergene, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(allergene);
      });

      it('should return initial array if no Allergene is added', () => {
        const allergeneCollection: IAllergene[] = [sampleWithRequiredData];
        expectedResult = service.addAllergeneToCollectionIfMissing(allergeneCollection, undefined, null);
        expect(expectedResult).toEqual(allergeneCollection);
      });
    });

    describe('compareAllergene', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareAllergene(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };
        const entity2 = null;

        const compareResult1 = service.compareAllergene(entity1, entity2);
        const compareResult2 = service.compareAllergene(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };
        const entity2 = { id: '7916bb91-6f33-42b1-a04f-81d88b92555e' };

        const compareResult1 = service.compareAllergene(entity1, entity2);
        const compareResult2 = service.compareAllergene(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };
        const entity2 = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };

        const compareResult1 = service.compareAllergene(entity1, entity2);
        const compareResult2 = service.compareAllergene(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
