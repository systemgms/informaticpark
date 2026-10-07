import {
  extractDataRows,
  mapCondition,
  parseCreatedAt,
  parseSerial,
  parseSurvey,
  planImport,
  RawRow,
} from './parse';

const COLUMN_COUNT = 28;

function columnIndex(letters: string): number {
  let index = 0;
  for (const char of letters) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

/** Builds a raw row from a map of spreadsheet column letters to values. */
function makeRow(
  sheetRow: number,
  cells: Record<string, string>,
  base: Record<string, string> = {},
): RawRow {
  const values = Array<string>(COLUMN_COUNT).fill('');
  const merged = { ...base, ...cells };
  for (const [letters, value] of Object.entries(merged)) {
    values[columnIndex(letters)] = value;
  }
  return { sheetRow, values };
}

const BASE: Record<string, string> = {
  A: 'sub-1',
  B: '04-04-2024 08:17 AM',
  D: 'MORONA',
  E: 'SAN JUAN BOSCO',
  F: 'COMPUTADOR',
  G: 'BUENO',
  H: 'SN-001',
  AA: 'Mayte Campoverde ',
  AB: 'Teniente Politico',
};

const row = (sheetRow: number, cells: Record<string, string> = {}) =>
  makeRow(sheetRow, cells, BASE);

describe('extractDataRows', () => {
  it('skips the two header rows and empty rows, keeping 1-based sheet rows', () => {
    const grid: string[][] = [
      ['group header'],
      ['Submission Id', 'Created At'],
      ['s1', '04-04-2024 08:17 AM', '', 'MORONA'],
      ['', '', ''],
      ['s2', '04-04-2024 08:18 AM'],
    ];
    const rows = extractDataRows(grid);
    expect(rows.map((r) => r.sheetRow)).toEqual([3, 5]);
    expect(rows[0].values[0]).toBe('s1');
  });
});

describe('parseCreatedAt', () => {
  it('parses AM times as Guayaquil (UTC-5)', () => {
    expect(parseCreatedAt('04-04-2024 08:17 AM')?.toISOString()).toBe(
      '2024-04-04T13:17:00.000Z',
    );
  });

  it('parses PM times', () => {
    expect(parseCreatedAt('27-03-2024 03:58 PM')?.toISOString()).toBe(
      '2024-03-27T20:58:00.000Z',
    );
  });

  it('handles 12 AM and 12 PM', () => {
    expect(parseCreatedAt('01-01-2024 12:05 AM')?.toISOString()).toBe(
      '2024-01-01T05:05:00.000Z',
    );
    expect(parseCreatedAt('01-01-2024 12:30 PM')?.toISOString()).toBe(
      '2024-01-01T17:30:00.000Z',
    );
  });

  it('returns null for invalid input', () => {
    expect(parseCreatedAt('')).toBeNull();
    expect(parseCreatedAt('yesterday')).toBeNull();
  });
});

describe('mapCondition', () => {
  it('maps the three known values, trimming and ignoring case', () => {
    expect(mapCondition('BUENO')).toEqual({
      condition: 'BUENO',
      anomaly: null,
    });
    expect(mapCondition(' REGULAR ')).toEqual({
      condition: 'REGULAR',
      anomaly: null,
    });
    expect(mapCondition('malo  ')).toEqual({
      condition: 'MALO',
      anomaly: null,
    });
  });

  it('defaults a missing condition to BUENO and flags it', () => {
    expect(mapCondition('')).toEqual({
      condition: 'BUENO',
      anomaly: 'missing-condition',
    });
  });

  it('defaults an unknown condition to BUENO and flags it', () => {
    expect(mapCondition('DAÑADO')).toEqual({
      condition: 'BUENO',
      anomaly: 'unknown-condition',
    });
  });
});

describe('parseSerial', () => {
  it('keeps a clean serial', () => {
    expect(parseSerial(' CNC107QN8K ')).toEqual({
      serialNumber: 'CNC107QN8K',
      brand: null,
      model: null,
      anomaly: null,
      original: null,
    });
  });

  it('reports an empty serial as missing', () => {
    expect(parseSerial('').anomaly).toBe('missing-serial');
    expect(parseSerial('').serialNumber).toBeNull();
  });

  it('treats placeholders as no serial', () => {
    for (const raw of ['S/N', 'SN', 's/n', '0', 'No disponemos']) {
      const result = parseSerial(raw);
      expect(result.serialNumber).toBeNull();
      expect(result.anomaly).toBe('placeholder-serial');
    }
  });

  it('parses MARCA/MODELO prose into brand and model', () => {
    expect(parseSerial('MARCA: BENQ MODELO: M106-PAU')).toEqual({
      serialNumber: null,
      brand: 'BENQ',
      model: 'M106-PAU',
      anomaly: 'dirty-serial',
      original: 'MARCA: BENQ MODELO: M106-PAU',
    });
  });

  it('flags serials with embedded whitespace as weird but keeps them', () => {
    const result = parseSerial('CPU HP   MXL1120182');
    expect(result.serialNumber).toBe('CPU HP MXL1120182');
    expect(result.anomaly).toBe('weird-serial');
  });

  it('strips a leading pipe artifact', () => {
    expect(parseSerial('|300100280007SM0705').serialNumber).toBe(
      '300100280007SM0705',
    );
  });
});

describe('parseSurvey per-type column selection', () => {
  it('reads COMPUTADOR columns G, H, I, J, K', () => {
    const { assets } = parseSurvey([
      row(3, {
        F: 'COMPUTADOR',
        G: 'REGULAR',
        H: 'COMP-SERIAL',
        I: 'Mouse',
        J: 'Teclado',
        K: 'Funciona lento',
        L: 'MALO',
        M: 'LAP-SERIAL',
      }),
    ]);
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      assetName: 'Computador',
      condition: 'REGULAR',
      serialNumber: 'COMP-SERIAL',
    });
    expect(assets[0].note).toBe(
      'Funciona lento\nPartes: Mouse\nFaltantes: Teclado',
    );
  });

  it('reads LAPTOP columns L, M, N, O, P', () => {
    const { assets } = parseSurvey([
      row(3, {
        F: 'LAPTOP',
        G: 'BUENO',
        H: 'IGNORED',
        L: 'MALO',
        M: 'LAP-SERIAL',
        N: 'Cargador',
        O: 'Bateria',
        P: 'Pantalla rota',
      }),
    ]);
    expect(assets[0]).toMatchObject({
      assetName: 'Laptop',
      condition: 'MALO',
      serialNumber: 'LAP-SERIAL',
    });
    expect(assets[0].note).toBe(
      'Pantalla rota\nPartes: Cargador\nFaltantes: Bateria',
    );
  });

  it('reads IMPRESORA columns Q, R, S, T, U', () => {
    const { assets } = parseSurvey([
      row(3, {
        F: 'IMPRESORA',
        H: 'IGNORED',
        Q: 'REGULAR',
        R: 'PRN-SERIAL',
        S: 'Cable',
        T: 'Toner',
        U: 'Atasca papel',
      }),
    ]);
    expect(assets[0]).toMatchObject({
      assetName: 'Impresora',
      condition: 'REGULAR',
      serialNumber: 'PRN-SERIAL',
    });
    expect(assets[0].note).toBe(
      'Atasca papel\nPartes: Cable\nFaltantes: Toner',
    );
  });

  it('reads OTROS name from V, serial W, condition X, observation Y', () => {
    const { assets } = parseSurvey([
      row(3, {
        F: 'OTROS',
        V: 'Monitor',
        W: 'MON-SERIAL',
        X: 'MALO',
        Y: 'Sin video',
      }),
    ]);
    expect(assets[0]).toMatchObject({
      assetName: 'Monitor',
      condition: 'MALO',
      serialNumber: 'MON-SERIAL',
      note: 'Sin video',
    });
  });

  it('skips rows with an unknown type and reports them', () => {
    const { assets, anomalies } = parseSurvey([row(3, { F: 'TELEVISOR' })]);
    expect(assets).toHaveLength(0);
    expect(anomalies).toEqual([
      expect.objectContaining({ kind: 'unknown-type', sheetRow: 3 }),
    ]);
  });

  it('names an unnamed OTROS row and reports it', () => {
    const { assets, anomalies } = parseSurvey([
      row(3, { F: 'OTROS', W: 'X1', X: 'BUENO' }),
    ]);
    expect(assets[0].assetName).toBe('Otro equipo');
    expect(anomalies.map((a) => a.kind)).toContain('missing-name');
  });
});

describe('parseSurvey assets', () => {
  it('builds previousCode from submission id and sheet row', () => {
    const { assets } = parseSurvey([row(7, { A: 'abc-123' })]);
    expect(assets[0].previousCode).toBe('abc-123#7');
  });

  it('sets entryDate, location text and leaves code and values null', () => {
    const { assets } = parseSurvey([row(3)]);
    expect(assets[0].entryDate?.toISOString()).toBe('2024-04-04T13:17:00.000Z');
    expect(assets[0].location).toBe('SAN JUAN BOSCO');
    expect(assets[0].brand).toBeNull();
    expect(assets[0].model).toBeNull();
  });

  it('moves dirty serial brand/model into the asset and keeps the original in the note', () => {
    const { assets, anomalies } = parseSurvey([
      row(3, {
        F: 'OTROS',
        V: 'Proyector',
        W: 'MARCA: BENQ MODELO: M106-PAU',
        X: 'BUENO',
      }),
    ]);
    expect(assets[0]).toMatchObject({
      brand: 'BENQ',
      model: 'M106-PAU',
      serialNumber: null,
    });
    expect(assets[0].note).toContain(
      'Serie original: MARCA: BENQ MODELO: M106-PAU',
    );
    expect(anomalies.map((a) => a.kind)).toContain('dirty-serial');
  });

  it('defaults a missing condition to BUENO with an anomaly', () => {
    const { assets, anomalies } = parseSurvey([row(3, { G: '' })]);
    expect(assets[0].condition).toBe('BUENO');
    expect(anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'missing-condition', sheetRow: 3 }),
      ]),
    );
  });

  it('reports an invalid date and leaves entryDate null', () => {
    const { assets, anomalies } = parseSurvey([row(3, { B: 'garbage' })]);
    expect(assets[0].entryDate).toBeNull();
    expect(anomalies.map((a) => a.kind)).toContain('invalid-date');
  });

  it('has an empty note when there is nothing to record', () => {
    const { assets } = parseSurvey([row(3)]);
    expect(assets[0].note).toBeNull();
  });
});

describe('parseSurvey custodians', () => {
  it('dedupes by normalized name, keeps first cargo and title-cases the name', () => {
    const { custodians, assets } = parseSurvey([
      row(3, { AA: 'Tatiana Bolaños ', AB: 'Teniente politico' }),
      row(4, { AA: 'TATIANA BOLAÑOS', AB: 'Otro cargo' }),
      row(5, { AA: 'tatiana  bolanos', AB: 'Tercer cargo' }),
    ]);
    expect(custodians).toHaveLength(1);
    expect(custodians[0]).toMatchObject({
      fullName: 'Tatiana Bolaños',
      unit: 'Teniente politico',
      identifier: 'SIN-CEDULA-TATIANA-BOLANOS',
    });
    expect(new Set(assets.map((a) => a.custodianKey)).size).toBe(1);
  });

  it('assigns the first-seen location to the custodian', () => {
    const { custodians } = parseSurvey([
      row(3, { E: 'PALORA', D: 'PALORA', AA: 'Ana Perez' }),
      row(4, { E: 'SEVILLA', D: 'MORONA', AA: 'Ana Perez' }),
    ]);
    expect(custodians[0].locationKey).toBe('PALORA|PALORA');
  });

  it('reports a missing custodian and links no custodian', () => {
    const { assets, anomalies } = parseSurvey([row(3, { AA: '' })]);
    expect(assets[0].custodianKey).toBeNull();
    expect(anomalies.map((a) => a.kind)).toContain('missing-custodian');
  });
});

describe('parseSurvey locations', () => {
  it('dedupes by normalized canton and parroquia keeping the first display', () => {
    const { locations, assets } = parseSurvey([
      row(3, { D: 'Morona', E: 'San Juan Bosco' }),
      row(4, { D: 'MORONA ', E: 'SAN JUAN  BOSCO' }),
      row(5, { D: 'Morona', E: 'Sevilla Don Bosco' }),
    ]);
    expect(locations).toHaveLength(2);
    expect(locations[0]).toMatchObject({
      canton: 'Morona',
      parroquia: 'San Juan Bosco',
    });
    expect(assets[1].locationKey).toBe(assets[0].locationKey);
    expect(assets[1].location).toBe('San Juan Bosco');
  });

  it('keeps accent variants together', () => {
    const { locations } = parseSurvey([
      row(3, { D: 'SUCÚA', E: 'SUCÚA' }),
      row(4, { D: 'SUCUA', E: 'SUCUA' }),
    ]);
    expect(locations).toHaveLength(1);
  });

  it('reports rows without any location', () => {
    const { assets, anomalies } = parseSurvey([row(3, { D: '', E: '' })]);
    expect(assets[0].locationKey).toBeNull();
    expect(assets[0].location).toBeNull();
    expect(anomalies.map((a) => a.kind)).toContain('missing-location');
  });
});

describe('planImport', () => {
  const parsed = parseSurvey([
    row(3, { A: 's1', AA: 'Ana Perez' }),
    row(4, { A: 's1', AA: 'Ana Perez' }),
    row(5, { A: 's2', AA: 'Luis Mora', D: 'PALORA', E: 'PALORA' }),
  ]);

  it('plans everything as new against an empty database', () => {
    const plan = planImport(parsed, {
      previousCodes: new Set(),
      locations: [],
      custodianIdentifiers: new Set(),
    });
    expect(plan.newAssets).toHaveLength(3);
    expect(plan.newLocations).toHaveLength(2);
    expect(plan.newCustodians).toHaveLength(2);
    expect(plan.skippedAssets).toBe(0);
  });

  it('skips existing assets, locations and custodians (idempotent re-run)', () => {
    const plan = planImport(parsed, {
      previousCodes: new Set(['s1#3', 's1#4', 's2#5']),
      locations: [
        { id: 10, canton: 'morona', parroquia: 'san juan  bosco' },
        { id: 11, canton: 'Palora', parroquia: 'Palora' },
      ],
      custodianIdentifiers: new Set([
        'SIN-CEDULA-ANA-PEREZ',
        'SIN-CEDULA-LUIS-MORA',
      ]),
    });
    expect(plan.newAssets).toHaveLength(0);
    expect(plan.skippedAssets).toBe(3);
    expect(plan.newLocations).toHaveLength(0);
    expect(plan.newCustodians).toHaveLength(0);
    expect(plan.existingLocationIds.get('MORONA|SAN JUAN BOSCO')).toBe(10);
  });
});
