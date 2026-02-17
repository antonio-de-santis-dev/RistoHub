import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IImmagineMenu } from '../immagine-menu.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../immagine-menu.test-samples';

import { ImmagineMenuService } from './immagine-menu.service';

const requireRestSample: IImmagineMenu = {
  ...sampleWithRequiredData,
};

describe('ImmagineMenu Service', () => {
  let service: ImmagineMenuService;
  let httpMock: HttpTestingController;
  let expectedResult: IImmagineMenu | IImmagineMenu[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ImmagineMenuService);
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

    it('should create a ImmagineMenu', () => {
      const immagineMenu = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(immagineMenu).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ImmagineMenu', () => {
      const immagineMenu = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(immagineMenu).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ImmagineMenu', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ImmagineMenu', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ImmagineMenu', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addImmagineMenuToCollectionIfMissing', () => {
      it('should add a ImmagineMenu to an empty array', () => {
        const immagineMenu: IImmagineMenu = sampleWithRequiredData;
        expectedResult = service.addImmagineMenuToCollectionIfMissing([], immagineMenu);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(immagineMenu);
      });

      it('should not add a ImmagineMenu to an array that contains it', () => {
        const immagineMenu: IImmagineMenu = sampleWithRequiredData;
        const immagineMenuCollection: IImmagineMenu[] = [
          {
            ...immagineMenu,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addImmagineMenuToCollectionIfMissing(immagineMenuCollection, immagineMenu);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ImmagineMenu to an array that doesn't contain it", () => {
        const immagineMenu: IImmagineMenu = sampleWithRequiredData;
        const immagineMenuCollection: IImmagineMenu[] = [sampleWithPartialData];
        expectedResult = service.addImmagineMenuToCollectionIfMissing(immagineMenuCollection, immagineMenu);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(immagineMenu);
      });

      it('should add only unique ImmagineMenu to an array', () => {
        const immagineMenuArray: IImmagineMenu[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const immagineMenuCollection: IImmagineMenu[] = [sampleWithRequiredData];
        expectedResult = service.addImmagineMenuToCollectionIfMissing(immagineMenuCollection, ...immagineMenuArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const immagineMenu: IImmagineMenu = sampleWithRequiredData;
        const immagineMenu2: IImmagineMenu = sampleWithPartialData;
        expectedResult = service.addImmagineMenuToCollectionIfMissing([], immagineMenu, immagineMenu2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(immagineMenu);
        expect(expectedResult).toContain(immagineMenu2);
      });

      it('should accept null and undefined values', () => {
        const immagineMenu: IImmagineMenu = sampleWithRequiredData;
        expectedResult = service.addImmagineMenuToCollectionIfMissing([], null, immagineMenu, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(immagineMenu);
      });

      it('should return initial array if no ImmagineMenu is added', () => {
        const immagineMenuCollection: IImmagineMenu[] = [sampleWithRequiredData];
        expectedResult = service.addImmagineMenuToCollectionIfMissing(immagineMenuCollection, undefined, null);
        expect(expectedResult).toEqual(immagineMenuCollection);
      });
    });

    describe('compareImmagineMenu', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareImmagineMenu(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };
        const entity2 = null;

        const compareResult1 = service.compareImmagineMenu(entity1, entity2);
        const compareResult2 = service.compareImmagineMenu(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };
        const entity2 = { id: 'b4e22f1f-4b76-4551-a1eb-e60cde093f8e' };

        const compareResult1 = service.compareImmagineMenu(entity1, entity2);
        const compareResult2 = service.compareImmagineMenu(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };
        const entity2 = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };

        const compareResult1 = service.compareImmagineMenu(entity1, entity2);
        const compareResult2 = service.compareImmagineMenu(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
