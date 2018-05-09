import { TestBed, inject } from '@angular/core/testing';

import { AntennasService } from './antennas.service';

describe('AntennasService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AntennasService]
    });
  });

  it('should be created', inject([AntennasService], (service: AntennasService) => {
    expect(service).toBeTruthy();
  }));
});
