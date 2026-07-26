export async function checkIfBlockedCountry(): Promise<boolean> {
  const apis = [
    { url: "https://ipwho.is/", getCountry: (d: any) => d?.country_code },
    { url: "https://ipapi.co/json/", getCountry: (d: any) => d?.country },
    { url: "https://api.country.is/", getCountry: (d: any) => d?.country },
  ];

  const blockedCountries = ["BR"];

  for (const api of apis) {
    try {
      const res = await fetch(api.url);
      if (!res.ok) continue;
      const data = await res.json();
      const country = api.getCountry(data);
      if (country) return blockedCountries.includes(country);
    } catch {
      continue;
    }
  }

  console.error("All IP APIs failed");
  return false;
}
