import { evaluateApplyGuard } from './safety';

const REMOTE = 'postgresql://user:secret@db.prisma.io:5432/postgres';
const LOCAL = 'postgresql://informaticpark:pw@localhost:5432/informaticpark';

describe('evaluateApplyGuard', () => {
  it('always allows a dry run, even against a remote host', () => {
    const result = evaluateApplyGuard({
      databaseUrl: REMOTE,
      shouldApply: false,
      isRemoteAllowed: false,
      confirmRemoteEnv: undefined,
    });
    expect(result.isAllowed).toBe(true);
    expect(result.host).toBe('db.prisma.io');
  });

  it('allows --apply on localhost, 127.0.0.1 and ::1', () => {
    for (const url of [
      LOCAL,
      'postgresql://u:p@127.0.0.1:5432/db',
      'postgresql://u:p@[::1]:5432/db',
    ]) {
      expect(
        evaluateApplyGuard({
          databaseUrl: url,
          shouldApply: true,
          isRemoteAllowed: false,
          confirmRemoteEnv: undefined,
        }).isAllowed,
      ).toBe(true);
    }
  });

  it('refuses --apply on a remote host without the extra flag', () => {
    const result = evaluateApplyGuard({
      databaseUrl: REMOTE,
      shouldApply: true,
      isRemoteAllowed: false,
      confirmRemoteEnv: 'yes',
    });
    expect(result.isAllowed).toBe(false);
  });

  it('refuses --apply on a remote host with the flag but no confirmation env', () => {
    const result = evaluateApplyGuard({
      databaseUrl: REMOTE,
      shouldApply: true,
      isRemoteAllowed: true,
      confirmRemoteEnv: undefined,
    });
    expect(result.isAllowed).toBe(false);
  });

  it('allows a remote --apply only with the flag AND CONFIRM_REMOTE_IMPORT=yes', () => {
    const result = evaluateApplyGuard({
      databaseUrl: REMOTE,
      shouldApply: true,
      isRemoteAllowed: true,
      confirmRemoteEnv: 'yes',
    });
    expect(result.isAllowed).toBe(true);
  });

  it('refuses a missing or invalid URL and never leaks the password', () => {
    expect(
      evaluateApplyGuard({
        databaseUrl: undefined,
        shouldApply: true,
        isRemoteAllowed: true,
        confirmRemoteEnv: 'yes',
      }).isAllowed,
    ).toBe(false);
    const bad = evaluateApplyGuard({
      databaseUrl: 'not a url',
      shouldApply: true,
      isRemoteAllowed: true,
      confirmRemoteEnv: 'yes',
    });
    expect(bad.isAllowed).toBe(false);
    const remote = evaluateApplyGuard({
      databaseUrl: REMOTE,
      shouldApply: true,
      isRemoteAllowed: false,
      confirmRemoteEnv: undefined,
    });
    expect(JSON.stringify(remote)).not.toContain('secret');
  });
});
