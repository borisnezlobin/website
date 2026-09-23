const VOWEL_LETTER_BUT_CONSONANT_SOUND = /^(uni|use|usu|eu|one|once)/i;
const SILENT_H = /^(hour|honest|honor|heir)/i;

export function indefiniteArticle(phrase: string): "a" | "an" {
    if (SILENT_H.test(phrase)) return "an";
    if (VOWEL_LETTER_BUT_CONSONANT_SOUND.test(phrase)) return "a";
    return /^[aeiou]/i.test(phrase) ? "an" : "a";
}

export function withArticle(phrase: string): string {
    return `${indefiniteArticle(phrase)} ${phrase}`;
}
