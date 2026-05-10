export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "NOK", symbol: "kr", label: "Norwegian Kroner (kr)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (C$)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { code: "NPR", symbol: "रू", label: "Nepali Rupee (रू)" },
  { code: "BDT", symbol: "৳", label: "Bangladeshi Taka (৳)" },
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee (₨)" },
  { code: "LKR", symbol: "Rs", label: "Sri Lankan Rupee (Rs)" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit (RM)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (¥)" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan (¥)" },
];

export function currencySymbol(code?: string): string {
  if (!code) return "kr";
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code + " ";
}

export function fmtMoney(amount: number, code?: string): string {
  return `${currencySymbol(code)}${(amount ?? 0).toLocaleString()}`;
}
