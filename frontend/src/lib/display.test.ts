import { EMPTY_FIELD } from './display';

describe('EMPTY_FIELD', () => {
  it('is the Spanish "Sin dato" placeholder, not an em dash', () => {
    expect(EMPTY_FIELD).toBe('Sin dato');
  });
});
