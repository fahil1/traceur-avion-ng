import { TestBed, inject } from '@angular/core/testing';

import { RecordingsService } from './recordings.service';

describe('RecordingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecordingsService]
    });
  });

  it('should be created', inject([RecordingsService], (service: RecordingsService) => {
    expect(service).toBeTruthy();
  }));
});
