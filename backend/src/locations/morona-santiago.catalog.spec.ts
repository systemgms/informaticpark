import {
  canonicalizeLocation,
  MORONA_SANTIAGO_CATALOG,
} from './morona-santiago.catalog';

const SURVEY_PAIRS: [string, string][] = [
  ['GUALAQUIZA', 'AMAZONAS'],
  ['GUALAQUIZA', 'BERMEJOS'],
  ['GUALAQUIZA', 'BOMBOIZA'],
  ['GUALAQUIZA', 'CHIGÜINDA'],
  ['GUALAQUIZA', 'EL ROSARIO AGUACATE'],
  ['GUALAQUIZA', 'GUALAQUIZA'],
  ['GUALAQUIZA', 'NUEVA TARQUI'],
  ['GUALAQUIZA', 'SAN MIGUEL DE CUYES'],
  ['HUAMBOYA', 'CHIGUAZA'],
  ['HUAMBOYA', 'HUAMBOYA'],
  ['LIMON INDANZA', 'GENERAL LEONIDAS PLAZA GUTIÉRREZ'],
  ['LIMON INDANZA', 'INDANZA'],
  ['LIMON INDANZA', 'SAN ANTONIO'],
  ['LIMON INDANZA', 'YUNGANZA - EL ROSARIO'],
  ['LOGROÑO', 'LOGROÑO'],
  ['MORONA', '9 DE OCTUBRE'],
  ['MORONA', 'CUCHAENTZA'],
  ['MORONA', 'GENERAL PROAÑO'],
  ['MORONA', 'SAN ISIDRO'],
  ['MORONA', 'SEVILLA DON BOSCO'],
  ['MORONA', 'SINAÍ'],
  ['MORONA', 'SUÑAC'],
  ['PALORA', 'ARAPICOS'],
  ['PALORA', 'PALORA'],
  ['PALORA', 'SANGAY'],
  ['SAN JUAN BOSCO', 'PAN DE AZUCAR'],
  ['SAN JUAN BOSCO', 'SAN CARLOS DE LIMÓN'],
  ['SAN JUAN BOSCO', 'SANJUAN BOSCO'],
  ['SANTIAGO DE MENDEZ', 'CHUPIANZA'],
  ['SANTIAGO DE MENDEZ', 'COPAL'],
  ['SANTIAGO DE MENDEZ', 'MENDEZ'],
  ['SANTIAGO DE MENDEZ', 'PATUCA'],
  ['SANTIAGO DE MENDEZ', 'SAN FRANCISCO DE CHINIMBIMI'],
  ['SANTIAGO DE MENDEZ', 'SAN LUIS DE ACHO'],
  ['SANTIAGO DE MENDEZ', 'TAYUZA'],
  ['SUCUA', 'ASUNCIÓN'],
  ['SUCUA', 'HUAMBI'],
  ['SUCUA', 'SANTA MARIANITA DE JESUS'],
  ['SUCUA', 'SUCUA'],
  ['TAISHA', 'TAISHA'],
  ['TIWINTZA', 'SAN JOSE DE MORONA'],
];

describe('MORONA_SANTIAGO_CATALOG', () => {
  it('has the 12 canton keys', () => {
    expect(Object.keys(MORONA_SANTIAGO_CATALOG)).toHaveLength(12);
  });

  it('places Huambi in Sucúa and El Rosario in Gualaquiza', () => {
    expect(MORONA_SANTIAGO_CATALOG['Sucúa']).toContain('Huambi');
    expect(MORONA_SANTIAGO_CATALOG['Morona']).not.toContain('Huambi');
    expect(MORONA_SANTIAGO_CATALOG['Gualaquiza']).toContain('El Rosario');
    expect(MORONA_SANTIAGO_CATALOG['San Juan Bosco']).not.toContain(
      'El Rosario',
    );
  });
});

describe('canonicalizeLocation', () => {
  it.each(SURVEY_PAIRS)(
    'resolves survey pair %s | %s to a known name',
    (c, p) => {
      const result = canonicalizeLocation(c, p);
      expect(result.isKnown).toBe(true);
      expect(result.canton).not.toBeNull();
      expect(MORONA_SANTIAGO_CATALOG[result.canton as string]).toContain(
        result.parroquia,
      );
    },
  );

  it('matches exact catalog names ignoring case, accents and spaces', () => {
    expect(canonicalizeLocation('limon  indanza', 'yunganza')).toEqual({
      canton: 'Limón Indanza',
      parroquia: 'Yunganza',
      isKnown: true,
    });
    expect(canonicalizeLocation('SUCUA', 'SUCUA')).toEqual({
      canton: 'Sucúa',
      parroquia: 'Sucúa',
      isKnown: true,
    });
  });

  it('applies canton and parroquia aliases', () => {
    expect(canonicalizeLocation('SANTIAGO DE MENDEZ', 'MENDEZ')).toEqual({
      canton: 'Santiago',
      parroquia: 'Méndez',
      isKnown: true,
    });
    expect(canonicalizeLocation('MORONA', '9 DE OCTUBRE')).toMatchObject({
      parroquia: 'Alshi',
    });
    expect(canonicalizeLocation('MORONA', 'SUÑAC')).toMatchObject({
      parroquia: 'Zuñac',
    });
    expect(
      canonicalizeLocation('GUALAQUIZA', 'EL ROSARIO AGUACATE'),
    ).toMatchObject({ canton: 'Gualaquiza', parroquia: 'El Rosario' });
    expect(
      canonicalizeLocation('LIMON INDANZA', 'YUNGANZA - EL ROSARIO'),
    ).toMatchObject({ parroquia: 'Yunganza' });
    expect(
      canonicalizeLocation('SANTIAGO DE MENDEZ', 'SAN LUIS DE ACHO'),
    ).toEqual({
      canton: 'Santiago',
      parroquia: 'San Luis del Acho',
      isKnown: true,
    });
  });

  it('can resolve the canton from a parroquia alias', () => {
    expect(canonicalizeLocation('SANJUAN BOSCO', 'SANJUAN BOSCO')).toEqual({
      canton: 'San Juan Bosco',
      parroquia: 'San Juan Bosco',
      isKnown: true,
    });
    expect(canonicalizeLocation(null, 'SANJUAN BOSCO')).toEqual({
      canton: 'San Juan Bosco',
      parroquia: 'San Juan Bosco',
      isKnown: true,
    });
  });

  it('keeps unknown values title-cased and flags them', () => {
    expect(canonicalizeLocation('NARNIA', 'CAIR  PARAVEL')).toEqual({
      canton: 'Narnia',
      parroquia: 'Cair Paravel',
      isKnown: false,
    });
    expect(canonicalizeLocation('MORONA', 'NOWHERE')).toEqual({
      canton: 'Morona',
      parroquia: 'Nowhere',
      isKnown: false,
    });
  });

  it('is idempotent on canonical output', () => {
    const once = canonicalizeLocation('SANTIAGO DE MENDEZ', 'MENDEZ');
    expect(canonicalizeLocation(once.canton, once.parroquia)).toEqual(once);
  });

  it('handles missing parts', () => {
    expect(canonicalizeLocation(null, null)).toEqual({
      canton: null,
      parroquia: null,
      isKnown: false,
    });
    expect(canonicalizeLocation('Morona', null)).toEqual({
      canton: 'Morona',
      parroquia: null,
      isKnown: true,
    });
  });
});
