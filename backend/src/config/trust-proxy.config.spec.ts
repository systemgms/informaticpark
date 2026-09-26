import { configureTrustProxy } from './trust-proxy.config';

describe('configureTrustProxy', () => {
  it('trusts exactly one proxy hop', () => {
    const app = { set: jest.fn() };

    configureTrustProxy(app);

    expect(app.set).toHaveBeenCalledTimes(1);
    expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
  });

  it('never trusts the full X-Forwarded-For chain', () => {
    const app = { set: jest.fn() };

    configureTrustProxy(app);

    expect(app.set).not.toHaveBeenCalledWith('trust proxy', true);
  });
});
