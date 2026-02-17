import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IProdotto } from '../prodotto.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../prodotto.test-samples';

import { ProdottoService } from './prodotto.service';

const requireRestSample: IProdotto = {
  ...sampleWithRequiredData,
};

describe('Prodotto Service', () => {
  let service: ProdottoService;
  let httpMock: HttpTestingController;
  let expectedResult: IProdotto | IProdotto[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ProdottoService);
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

    it('should create a Prodotto', () => {
      const prodotto = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(prodotto).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Prodotto', () => {
      const prodotto = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(prodotto).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Prodotto', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Prodotto', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Prodotto', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addProdottoToCollectionIfMissing', () => {
      it('should add a Prodotto to an empty array', () => {
        const prodotto: IProdotto = sampleWithRequiredData;
        expectedResult = service.addProdottoToCollectionIfMissing([], prodotto);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(prodotto);
      });

      it('should not add a Prodotto to an array that contains it', () => {
        const prodotto: IProdotto = sampleWithRequiredData;
        const prodottoCollection: IProdotto[] = [
          {
            ...prodotto,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addProdottoToCollectionIfMissing(prodottoCollection, prodotto);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Prodotto to an array that doesn't contain it", () => {
        const prodotto: IProdotto = sampleWithRequiredData;
        const prodottoCollection: IProdotto[] = [sampleWithPartialData];
        expectedResult = service.addProdottoToCollectionIfMissing(prodottoCollection, prodotto);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(prodotto);
      });

      it('should add only unique Prodotto to an array', () => {
        const prodottoArray: IProdotto[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const prodottoCollection: IProdotto[] = [sampleWithRequiredData];
        expectedResult = service.addProdottoToCollectionIfMissing(prodottoCollection, ...prodottoArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const prodotto: IProdotto = sampleWithRequiredData;
        const prodotto2: IProdotto = sampleWithPartialData;
        expectedResult = service.addProdottoToCollectionIfMissing([], prodotto, prodotto2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(prodotto);
        expect(expectedResult).toContain(prodotto2);
      });

      it('should accept null and undefined values', () => {
        const prodotto: IProdotto = sampleWithRequiredData;
        expectedResult = service.addProdottoToCollectionIfMissing([], null, prodotto, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(prodotto);
      });

      it('should return initial array if no Prodotto is added', () => {
        const prodottoCollection: IProdotto[] = [sampleWithRequiredData];
        expectedResult = service.addProdottoToCollectionIfMissing(prodottoCollection, undefined, null);
        expect(expectedResult).toEqual(prodottoCollection);
      });
    });

    describe('compareProdotto', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareProdotto(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
        const entity2 = null;

        const compareResult1 = service.compareProdotto(entity1, entity2);
        const compareResult2 = service.compareProdotto(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
        const entity2 = { id: 'b535ea01-d7dd-4cfe-9ddf-1777df7d8ada' };

        const compareResult1 = service.compareProdotto(entity1, entity2);
        const compareResult2 = service.compareProdotto(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
        const entity2 = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };

        const compareResult1 = service.compareProdotto(entity1, entity2);
        const compareResult2 = service.compareProdotto(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
