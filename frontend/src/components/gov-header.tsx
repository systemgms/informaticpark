import { GovStripe } from '@/components/gov-stripe';

const INSTITUTION_LINE = 'Gobernación de la Provincia de Morona Santiago';

/**
 * Public-page header with the Government of Ecuador identity.
 * The logo asset is the official mark taken from presidencia.gob.ec, for use by the
 * institution only. The institution must validate its use before production.
 */
export function GovHeader() {
  return (
    <header className="bg-[#272965] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset; next/image optimization is unnecessary */}
        <img
          src="/brand/gobierno-ecuador-white.svg"
          alt="Gobierno del Ecuador"
          width={105}
          height={36}
          className="h-9 w-auto sm:h-12"
        />
        <p className="text-sm text-white/80 md:text-right">{INSTITUTION_LINE}</p>
      </div>
      <GovStripe />
    </header>
  );
}
