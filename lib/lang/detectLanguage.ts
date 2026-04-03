type Lang =
  | "zh"
  | "ja"
  | "ko"
  | "ru"
  | "ar"
  | "de"
  | "fr"
  | "es"
  | "pt"
  | "it"
  | "en";

function inRange(code: number, start: number, end: number) {
  return code >= start && code <= end;
}

export function detectLanguage(input: string): Lang {
  const counts: Record<Lang, number> = {
    zh: 0,
    ja: 0,
    ko: 0,
    ru: 0,
    ar: 0,
    de: 0,
    fr: 0,
    es: 0,
    pt: 0,
    it: 0,
    en: 0,
  };

  let lastLang: Lang | null = null;

  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;

    if (inRange(code, 0x4e00, 0x9fff) || inRange(code, 0x3400, 0x4dbf)) {
      counts.zh += 1;
      lastLang = "zh";
      continue;
    }

    if (
      inRange(code, 0x3040, 0x309f) ||
      inRange(code, 0x30a0, 0x30ff) ||
      inRange(code, 0x31f0, 0x31ff)
    ) {
      counts.ja += 1;
      lastLang = "ja";
      continue;
    }

    if (
      inRange(code, 0x1100, 0x11ff) ||
      inRange(code, 0xac00, 0xd7af) ||
      inRange(code, 0x3130, 0x318f)
    ) {
      counts.ko += 1;
      lastLang = "ko";
      continue;
    }

    if (inRange(code, 0x0400, 0x04ff)) {
      counts.ru += 1;
      lastLang = "ru";
      continue;
    }

    if (inRange(code, 0x0600, 0x06ff)) {
      counts.ar += 1;
      lastLang = "ar";
      continue;
    }

    const lower = ch.toLowerCase();

    if ("äöüß".includes(lower)) {
      counts.de += 1;
      lastLang = "de";
      continue;
    }

    if ("àâçéèêëîïôùûüÿœ".includes(lower)) {
      counts.fr += 1;
      lastLang = "fr";
      continue;
    }

    if ("áéíóúñü".includes(lower)) {
      counts.es += 1;
      lastLang = "es";
      continue;
    }

    if ("áàâãçéêíóôõúü".includes(lower)) {
      counts.pt += 1;
      lastLang = "pt";
      continue;
    }

    if ("àèéìòóù".includes(lower)) {
      counts.it += 1;
      lastLang = "it";
      continue;
    }

    if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
      counts.en += 1;
      lastLang = "en";
    }
  }

  const entries = Object.entries(counts) as Array<[Lang, number]>;
  entries.sort((a, b) => b[1] - a[1]);

  const [topLang, topCount] = entries[0];
  const [, secondCount] = entries[1];

  if (topCount === 0) return "en";

  const isClearWinner = topCount >= 3 && topCount >= secondCount + 2;
  if (isClearWinner) return topLang;

  if (lastLang) return lastLang;
  return "en";
}
