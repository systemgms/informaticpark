// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { AssetList } from '@/app/admin/assets/asset-list';
import { SelectableAssetList } from '@/app/admin/assets/traspasar/selectable-asset-list';
import { CustodianList } from '@/app/admin/custodians/custodian-list';
import { LocationList } from '@/app/admin/locations/location-list';
import { PublicAssetList } from '@/app/public/assets/asset-list';
import { PublicCustodianList } from '@/app/public/custodians/custodian-list';
import type { Asset, Custodian, Location, PublicAsset, PublicCustodian } from '@/lib/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const NO_OP = () => {};

function expectPlaceholder(container: HTMLElement) {
  expect(container.textContent).not.toContain('—');
  expect(container.textContent).toContain('Sin dato');
}

describe('empty values in lists render "Sin dato" instead of an em dash', () => {
  it('admin asset list', () => {
    const assets = [{ id: 1, assetName: 'Equipo' }] as Asset[];
    const { container } = render(
      <AssetList assets={assets} isLoading={false} error={null} isAdmin hasSearch={false} onDeleteClick={NO_OP} />,
    );
    expectPlaceholder(container);
  });

  it('traspasar selectable asset list', () => {
    const assets = [{ id: 1, assetName: 'Equipo' }] as Asset[];
    const { container } = render(
      <SelectableAssetList
        assets={assets}
        isLoading={false}
        error={null}
        hasSearch={false}
        selectedIds={new Set()}
        onToggleSelect={NO_OP}
      />,
    );
    expectPlaceholder(container);
  });

  it('admin custodian list', () => {
    const custodians = [{ id: 1, fullName: 'Ana' }] as Custodian[];
    const { container } = render(
      <CustodianList custodians={custodians} isLoading={false} error={null} hasSearch={false} onDeleteClick={NO_OP} />,
    );
    expectPlaceholder(container);
  });

  it('admin location list', () => {
    const locations = [{ id: 1 }] as Location[];
    const { container } = render(
      <LocationList locations={locations} isLoading={false} error={null} hasSearch={false} onDeleteClick={NO_OP} />,
    );
    expectPlaceholder(container);
  });

  it('public asset list', () => {
    const assets = [{ id: 1, assetName: 'Equipo' }] as PublicAsset[];
    const { container } = render(<PublicAssetList assets={assets} isLoading={false} error={null} hasSearch={false} />);
    expectPlaceholder(container);
  });

  it('public custodian list', () => {
    const custodians = [{ id: 1, fullName: 'Ana' }] as PublicCustodian[];
    const { container } = render(
      <PublicCustodianList custodians={custodians} isLoading={false} error={null} hasSearch={false} />,
    );
    expectPlaceholder(container);
  });
});
