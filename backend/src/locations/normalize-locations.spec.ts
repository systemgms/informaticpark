import {
  planAssetTextUpdates,
  planLocationNormalization,
} from './normalize-locations';

describe('planLocationNormalization', () => {
  it('renames locations whose names are not canonical', () => {
    const plan = planLocationNormalization([
      { id: 1, canton: 'SANTIAGO DE MENDEZ', parroquia: 'MENDEZ' },
      { id: 2, canton: 'Sucúa', parroquia: 'Sucúa' },
    ]);
    expect(plan.renames).toEqual([
      {
        id: 1,
        from: { canton: 'SANTIAGO DE MENDEZ', parroquia: 'MENDEZ' },
        to: { canton: 'Santiago', parroquia: 'Méndez' },
      },
    ]);
    expect(plan.merges).toEqual([]);
    expect(plan.unknown).toEqual([]);
    expect(plan.unchangedCount).toBe(1);
  });

  it('merges rows that collapse to the same canonical pair into the lowest id', () => {
    const plan = planLocationNormalization([
      { id: 7, canton: 'Gualaquiza', parroquia: 'Bermejos' },
      { id: 3, canton: 'GUALAQUIZA', parroquia: 'BERMEJOS' },
      { id: 9, canton: 'Gualaquiza', parroquia: 'bermejos' },
    ]);
    expect(plan.merges).toEqual([
      { survivorId: 3, duplicateId: 7 },
      { survivorId: 3, duplicateId: 9 },
    ]);
    expect(plan.renames.map((r) => r.id)).toEqual([3]);
    expect(plan.unchangedCount).toBe(0);
  });

  it('reports unknown locations and leaves them untouched', () => {
    const plan = planLocationNormalization([
      { id: 1, canton: 'NARNIA', parroquia: 'CAIR PARAVEL' },
      { id: 2, canton: 'NARNIA', parroquia: 'Cair Paravel' },
    ]);
    expect(plan.unknown).toHaveLength(2);
    expect(plan.renames).toEqual([]);
    expect(plan.merges).toEqual([]);
  });

  it('is idempotent: canonical input yields no changes', () => {
    const plan = planLocationNormalization([
      { id: 1, canton: 'Santiago', parroquia: 'Méndez' },
      { id: 2, canton: 'Morona', parroquia: 'Alshi' },
    ]);
    expect(plan.renames).toEqual([]);
    expect(plan.merges).toEqual([]);
    expect(plan.unknown).toEqual([]);
    expect(plan.unchangedCount).toBe(2);
  });

  it('keeps a canton-only location known', () => {
    const plan = planLocationNormalization([
      { id: 1, canton: 'MORONA', parroquia: null },
    ]);
    expect(plan.renames).toEqual([
      {
        id: 1,
        from: { canton: 'MORONA', parroquia: null },
        to: { canton: 'Morona', parroquia: null },
      },
    ]);
  });
});

describe('planAssetTextUpdates', () => {
  const locations = [
    { id: 1, canton: 'SANTIAGO DE MENDEZ', parroquia: 'MENDEZ' },
    { id: 2, canton: 'SANTIAGO DE MENDEZ', parroquia: 'mendez' },
    { id: 3, canton: 'NARNIA', parroquia: 'CAIR PARAVEL' },
  ];

  it('updates only text equal to the old parroquia by normalized key', () => {
    const updates = planAssetTextUpdates(locations, [
      { id: 10, locationId: 1, location: 'MENDEZ' },
      { id: 11, locationId: 1, location: 'Méndez' },
      { id: 12, locationId: 1, location: 'Sala de reuniones' },
      { id: 13, locationId: 2, location: 'Mendez' },
      { id: 14, locationId: 3, location: 'CAIR PARAVEL' },
      { id: 15, locationId: 1, location: null },
      { id: 16, locationId: null, location: 'MENDEZ' },
    ]);
    expect(updates).toEqual([
      { assetId: 10, location: 'Méndez' },
      { assetId: 13, location: 'Méndez' },
    ]);
  });
});
