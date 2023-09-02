import { TestBed } from '@angular/core/testing';

import { SubsessionProviderService } from './subsession-provider.service';

describe('SubsessionProviderService', () => {
  let service: SubsessionProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubsessionProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
