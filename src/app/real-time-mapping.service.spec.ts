import { TestBed, inject } from '@angular/core/testing';

import { RealTimeMappingService } from './real-time-mapping.service';

describe('RealTimeMappingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RealTimeMappingService]
    });
  });

  it('should be created', inject([RealTimeMappingService], (service: RealTimeMappingService) => {
    expect(service).toBeTruthy();
  }));
});
