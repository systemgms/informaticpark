// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { AssetList } from './asset-list';
import { Asset, AssetCondition } from '@/lib/types';

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 1,
    assetName: 'Laptop Dell',
    code: 'A1',
    condition: AssetCondition.BUENO,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as Asset;
}

describe('AssetList condition badge', () => {
  it('shows the Spanish label for each condition, in both the mobile cards and the table', () => {
    const assets = [
      makeAsset({ id: 1, assetName: 'Laptop Dell', condition: AssetCondition.BUENO }),
      makeAsset({ id: 2, assetName: 'Impresora HP', condition: AssetCondition.MALO }),
      makeAsset({ id: 3, assetName: 'Router TP-Link', condition: AssetCondition.EN_MANTENIMIENTO }),
    ];

    render(
      <AssetList
        assets={assets}
        isLoading={false}
        error={null}
        isAdmin={true}
        hasSearch={false}
        onDeleteClick={() => {}}
      />,
    );

    // Rendered twice: once in the mobile card list, once in the desktop table.
    expect(screen.getAllByText('Bueno').length).toBe(2);
    expect(screen.getAllByText('Malo').length).toBe(2);
    expect(screen.getAllByText('En mantenimiento').length).toBe(2);
  });
});
