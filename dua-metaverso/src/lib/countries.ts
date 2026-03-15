export interface Country {
  code: string;
  name: string;
  flag: string;
  lusophone: boolean;
}

export const LUSOPHONE_COUNTRIES: Country[] = [
  { code: "PT", name: "Portugal", flag: "\uD83C\uDDF5\uD83C\uDDF9", lusophone: true },
  { code: "BR", name: "Brasil", flag: "\uD83C\uDDE7\uD83C\uDDF7", lusophone: true },
  { code: "CV", name: "Cabo Verde", flag: "\uD83C\uDDE8\uD83C\uDDFB", lusophone: true },
  { code: "GW", name: "Guine-Bissau", flag: "\uD83C\uDDEC\uD83C\uDDFC", lusophone: true },
  { code: "AO", name: "Angola", flag: "\uD83C\uDDE6\uD83C\uDDF4", lusophone: true },
  { code: "MZ", name: "Mocambique", flag: "\uD83C\uDDF2\uD83C\uDDFF", lusophone: true },
  { code: "ST", name: "Sao Tome e Principe", flag: "\uD83C\uDDF8\uD83C\uDDF9", lusophone: true },
  { code: "TL", name: "Timor-Leste", flag: "\uD83C\uDDF9\uD83C\uDDF1", lusophone: true },
  { code: "GQ", name: "Guine Equatorial", flag: "\uD83C\uDDEC\uD83C\uDDF6", lusophone: true },
];

export const OTHER_COUNTRIES: Country[] = [
  { code: "AF", name: "Afeganistao", flag: "\uD83C\uDDE6\uD83C\uDDEB", lusophone: false },
  { code: "AL", name: "Albania", flag: "\uD83C\uDDE6\uD83C\uDDF1", lusophone: false },
  { code: "DZ", name: "Argelia", flag: "\uD83C\uDDE9\uD83C\uDDFF", lusophone: false },
  { code: "AR", name: "Argentina", flag: "\uD83C\uDDE6\uD83C\uDDF7", lusophone: false },
  { code: "AU", name: "Australia", flag: "\uD83C\uDDE6\uD83C\uDDFA", lusophone: false },
  { code: "AT", name: "Austria", flag: "\uD83C\uDDE6\uD83C\uDDF9", lusophone: false },
  { code: "BE", name: "Belgica", flag: "\uD83C\uDDE7\uD83C\uDDEA", lusophone: false },
  { code: "BO", name: "Bolivia", flag: "\uD83C\uDDE7\uD83C\uDDF4", lusophone: false },
  { code: "CA", name: "Canada", flag: "\uD83C\uDDE8\uD83C\uDDE6", lusophone: false },
  { code: "CL", name: "Chile", flag: "\uD83C\uDDE8\uD83C\uDDF1", lusophone: false },
  { code: "CN", name: "China", flag: "\uD83C\uDDE8\uD83C\uDDF3", lusophone: false },
  { code: "CO", name: "Colombia", flag: "\uD83C\uDDE8\uD83C\uDDF4", lusophone: false },
  { code: "CG", name: "Congo", flag: "\uD83C\uDDE8\uD83C\uDDEC", lusophone: false },
  { code: "CR", name: "Costa Rica", flag: "\uD83C\uDDE8\uD83C\uDDF7", lusophone: false },
  { code: "CU", name: "Cuba", flag: "\uD83C\uDDE8\uD83C\uDDFA", lusophone: false },
  { code: "DK", name: "Dinamarca", flag: "\uD83C\uDDE9\uD83C\uDDF0", lusophone: false },
  { code: "EC", name: "Equador", flag: "\uD83C\uDDEA\uD83C\uDDE8", lusophone: false },
  { code: "EG", name: "Egito", flag: "\uD83C\uDDEA\uD83C\uDDEC", lusophone: false },
  { code: "ES", name: "Espanha", flag: "\uD83C\uDDEA\uD83C\uDDF8", lusophone: false },
  { code: "US", name: "Estados Unidos", flag: "\uD83C\uDDFA\uD83C\uDDF8", lusophone: false },
  { code: "FI", name: "Finlandia", flag: "\uD83C\uDDEB\uD83C\uDDEE", lusophone: false },
  { code: "FR", name: "Franca", flag: "\uD83C\uDDEB\uD83C\uDDF7", lusophone: false },
  { code: "DE", name: "Alemanha", flag: "\uD83C\uDDE9\uD83C\uDDEA", lusophone: false },
  { code: "GH", name: "Gana", flag: "\uD83C\uDDEC\uD83C\uDDED", lusophone: false },
  { code: "GR", name: "Grecia", flag: "\uD83C\uDDEC\uD83C\uDDF7", lusophone: false },
  { code: "IN", name: "India", flag: "\uD83C\uDDEE\uD83C\uDDF3", lusophone: false },
  { code: "ID", name: "Indonesia", flag: "\uD83C\uDDEE\uD83C\uDDE9", lusophone: false },
  { code: "IE", name: "Irlanda", flag: "\uD83C\uDDEE\uD83C\uDDEA", lusophone: false },
  { code: "IL", name: "Israel", flag: "\uD83C\uDDEE\uD83C\uDDF1", lusophone: false },
  { code: "IT", name: "Italia", flag: "\uD83C\uDDEE\uD83C\uDDF9", lusophone: false },
  { code: "JP", name: "Japao", flag: "\uD83C\uDDEF\uD83C\uDDF5", lusophone: false },
  { code: "KE", name: "Quenia", flag: "\uD83C\uDDF0\uD83C\uDDEA", lusophone: false },
  { code: "KR", name: "Coreia do Sul", flag: "\uD83C\uDDF0\uD83C\uDDF7", lusophone: false },
  { code: "LU", name: "Luxemburgo", flag: "\uD83C\uDDF1\uD83C\uDDFA", lusophone: false },
  { code: "MX", name: "Mexico", flag: "\uD83C\uDDF2\uD83C\uDDFD", lusophone: false },
  { code: "MA", name: "Marrocos", flag: "\uD83C\uDDF2\uD83C\uDDE6", lusophone: false },
  { code: "NL", name: "Paises Baixos", flag: "\uD83C\uDDF3\uD83C\uDDF1", lusophone: false },
  { code: "NG", name: "Nigeria", flag: "\uD83C\uDDF3\uD83C\uDDEC", lusophone: false },
  { code: "NO", name: "Noruega", flag: "\uD83C\uDDF3\uD83C\uDDF4", lusophone: false },
  { code: "NZ", name: "Nova Zelandia", flag: "\uD83C\uDDF3\uD83C\uDDFF", lusophone: false },
  { code: "PE", name: "Peru", flag: "\uD83C\uDDF5\uD83C\uDDEA", lusophone: false },
  { code: "PH", name: "Filipinas", flag: "\uD83C\uDDF5\uD83C\uDDED", lusophone: false },
  { code: "PL", name: "Polonia", flag: "\uD83C\uDDF5\uD83C\uDDF1", lusophone: false },
  { code: "RO", name: "Romenia", flag: "\uD83C\uDDF7\uD83C\uDDF4", lusophone: false },
  { code: "RU", name: "Russia", flag: "\uD83C\uDDF7\uD83C\uDDFA", lusophone: false },
  { code: "SA", name: "Arabia Saudita", flag: "\uD83C\uDDF8\uD83C\uDDE6", lusophone: false },
  { code: "SN", name: "Senegal", flag: "\uD83C\uDDF8\uD83C\uDDF3", lusophone: false },
  { code: "ZA", name: "Africa do Sul", flag: "\uD83C\uDDFF\uD83C\uDDE6", lusophone: false },
  { code: "SE", name: "Suecia", flag: "\uD83C\uDDF8\uD83C\uDDEA", lusophone: false },
  { code: "CH", name: "Suica", flag: "\uD83C\uDDE8\uD83C\uDDED", lusophone: false },
  { code: "TH", name: "Tailandia", flag: "\uD83C\uDDF9\uD83C\uDDED", lusophone: false },
  { code: "TR", name: "Turquia", flag: "\uD83C\uDDF9\uD83C\uDDF7", lusophone: false },
  { code: "UA", name: "Ucrania", flag: "\uD83C\uDDFA\uD83C\uDDE6", lusophone: false },
  { code: "AE", name: "Emirados Arabes", flag: "\uD83C\uDDE6\uD83C\uDDEA", lusophone: false },
  { code: "GB", name: "Reino Unido", flag: "\uD83C\uDDEC\uD83C\uDDE7", lusophone: false },
  { code: "UY", name: "Uruguai", flag: "\uD83C\uDDFA\uD83C\uDDFE", lusophone: false },
  { code: "VE", name: "Venezuela", flag: "\uD83C\uDDFB\uD83C\uDDEA", lusophone: false },
  { code: "VN", name: "Vietname", flag: "\uD83C\uDDFB\uD83C\uDDF3", lusophone: false },
];

export const ALL_COUNTRIES: Country[] = [...LUSOPHONE_COUNTRIES, ...OTHER_COUNTRIES];

export function getCountryByCode(code: string): Country | undefined {
  return ALL_COUNTRIES.find((c) => c.code === code);
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag ?? "";
}
