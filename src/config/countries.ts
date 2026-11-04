/**
 * Country catalogue.
 *
 * Configurable by design: onboarding asks for a country, never an address, and
 * countries are data rather than hard-coded options in the form.
 *
 * Coverage priority is African states, because WAZOBIA is an Africa-first
 * platform, followed by a small set of common diaspora destinations. Adding a
 * country is one record — no form changes.
 *
 * Alpha-2 codes are used as the stored value. No subdivision, city or address
 * field exists anywhere in the onboarding flow.
 */

export interface Country {
  readonly code: string
  readonly name: string
  /** African states sort first: they are the primary audience. */
  readonly region: 'africa' | 'other'
}

type CountryTuple = readonly [code: string, name: string]

function toCountries(tuples: readonly CountryTuple[], region: Country['region']): readonly Country[] {
  return tuples.map(([code, name]) => ({ code, name, region }))
}

const AFRICAN: readonly Country[] = toCountries([
  ['DZ', 'Algeria'], ['AO', 'Angola'], ['BJ', 'Benin'], ['BW', 'Botswana'],
  ['BF', 'Burkina Faso'], ['BI', 'Burundi'], ['CV', 'Cabo Verde'], ['CM', 'Cameroon'],
  ['CF', 'Central African Republic'], ['TD', 'Chad'], ['KM', 'Comoros'],
  ['CG', 'Congo — Republic'], ['CD', 'Congo — Democratic Republic'], ['CI', "Côte d'Ivoire"],
  ['DJ', 'Djibouti'], ['EG', 'Egypt'], ['GQ', 'Equatorial Guinea'], ['ER', 'Eritrea'],
  ['SZ', 'Eswatini'], ['ET', 'Ethiopia'], ['GA', 'Gabon'], ['GM', 'Gambia'],
  ['GH', 'Ghana'], ['GN', 'Guinea'], ['GW', 'Guinea-Bissau'], ['KE', 'Kenya'],
  ['LS', 'Lesotho'], ['LR', 'Liberia'], ['LY', 'Libya'], ['MG', 'Madagascar'],
  ['MW', 'Malawi'], ['ML', 'Mali'], ['MR', 'Mauritania'], ['MU', 'Mauritius'],
  ['MA', 'Morocco'], ['MZ', 'Mozambique'], ['NA', 'Namibia'], ['NE', 'Niger'],
  ['NG', 'Nigeria'], ['RW', 'Rwanda'], ['ST', 'São Tomé and Príncipe'], ['SN', 'Senegal'],
  ['SC', 'Seychelles'], ['SL', 'Sierra Leone'], ['SO', 'Somalia'], ['ZA', 'South Africa'],
  ['SS', 'South Sudan'], ['SD', 'Sudan'], ['TZ', 'Tanzania'], ['TG', 'Togo'],
  ['TN', 'Tunisia'], ['UG', 'Uganda'], ['ZM', 'Zambia'], ['ZW', 'Zimbabwe'],
], 'africa')

const OTHER: readonly Country[] = toCountries([
  ['AU', 'Australia'], ['BE', 'Belgium'], ['BR', 'Brazil'], ['CA', 'Canada'],
  ['CN', 'China'], ['FR', 'France'], ['DE', 'Germany'], ['IN', 'India'],
  ['IE', 'Ireland'], ['IT', 'Italy'], ['JM', 'Jamaica'], ['JP', 'Japan'],
  ['NL', 'Netherlands'], ['NZ', 'New Zealand'], ['PT', 'Portugal'], ['SA', 'Saudi Arabia'],
  ['ES', 'Spain'], ['SE', 'Sweden'], ['CH', 'Switzerland'], ['TT', 'Trinidad and Tobago'],
  ['AE', 'United Arab Emirates'], ['GB', 'United Kingdom'], ['US', 'United States'],
], 'other')

export const COUNTRIES: readonly Country[] = [...AFRICAN, ...OTHER]

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]))

export function findCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined
  return COUNTRY_BY_CODE.get(code)
}

export function isCountryCode(value: unknown): value is string {
  return typeof value === 'string' && COUNTRY_BY_CODE.has(value)
}

/**
 * Sentinel stored when a user declines to answer. Recorded explicitly rather
 * than left blank, so "declined" and "unanswered" stay distinguishable.
 */
export const PREFER_NOT_TO_SAY = 'prefer_not_to_say' as const
