import { isPublicPath } from './public-path';

describe('isPublicPath', () => {
  it('treats the landing page as public', () => {
    expect(isPublicPath('/')).toBe(true);
  });

  it('treats the login page as public', () => {
    expect(isPublicPath('/login')).toBe(true);
  });

  it('treats the public portal and its subpaths as public', () => {
    expect(isPublicPath('/public')).toBe(true);
    expect(isPublicPath('/public/assets')).toBe(true);
    expect(isPublicPath('/public/custodians')).toBe(true);
  });

  it('does not treat the dashboard as public', () => {
    expect(isPublicPath('/dashboard')).toBe(false);
  });

  it('does not treat admin routes as public', () => {
    expect(isPublicPath('/admin/assets')).toBe(false);
  });

  it('does not treat a path that merely starts with the public prefix as public', () => {
    expect(isPublicPath('/publicity')).toBe(false);
  });
});
