// Common emoji suggestions for shared list items
export const EMOJI_SUGGESTIONS: Record<string, string> = {
  // Groceries
  tomato: '\ud83c\udf45',
  tomatoes: '\ud83c\udf45',
  milk: '\ud83e\udd5b',
  bread: '\ud83c\udf5e',
  egg: '\ud83e\udd5a',
  eggs: '\ud83e\udd5a',
  cheese: '\ud83e\uddc0',
  butter: '\ud83e\uddc8',
  apple: '\ud83c\udf4e',
  banana: '\ud83c\udf4c',
  orange: '\ud83c\udf4a',
  grape: '\ud83c\udf47',
  grapes: '\ud83c\udf47',
  strawberry: '\ud83c\udf53',
  watermelon: '\ud83c\udf49',
  lemon: '\ud83c\udf4b',
  avocado: '\ud83e\udd51',
  chicken: '\ud83c\udf57',
  meat: '\ud83e\udd69',
  fish: '\ud83d\udc1f',
  rice: '\ud83c\udf5a',
  pasta: '\ud83c\udf5d',
  pizza: '\ud83c\udf55',
  burger: '\ud83c\udf54',
  coffee: '\u2615',
  tea: '\ud83c\udf75',
  water: '\ud83d\udca7',
  juice: '\ud83e\uddc3',
  sugar: '\ud83c\udf6c',
  salt: '\ud83e\uddc2',
  oil: '\ud83e\uded2',
  onion: '\ud83e\uddc5',
  garlic: '\ud83e\uddc4',
  potato: '\ud83e\udd54',
  carrot: '\ud83e\udd55',
  corn: '\ud83c\udf3d',
  pepper: '\ud83c\udf36',
  mushroom: '\ud83c\udf44',
  broccoli: '\ud83e\udd66',
  lettuce: '\ud83e\udd6c',
  cucumber: '\ud83e\udd52',
  // Household
  soap: '\ud83e\uddfc',
  towel: '\ud83e\uddd9',
  tissue: '\ud83e\uddfb',
  paper: '\ud83e\uddfb',
  sponge: '\ud83e\uddfd',
  // Items
  keys: '\ud83d\udd11',
  wallet: '\ud83d\udcb0',
  phone: '\ud83d\udcf1',
  charger: '\ud83d\udd0c',
  laptop: '\ud83d\udcbb',
  headphones: '\ud83c\udfa7',
  glasses: '\ud83d\udc53',
  umbrella: '\u2602\ufe0f',
  medicine: '\ud83d\udc8a',
  book: '\ud83d\udcd6',
  pen: '\ud83d\udd8a\ufe0f',
  bag: '\ud83d\udc5c',
  shoes: '\ud83d\udc5f',
  jacket: '\ud83e\udde5',
  hat: '\ud83e\udde2',
  watch: '\u231a',
  camera: '\ud83d\udcf7',
  gift: '\ud83c\udf81',
  flower: '\ud83c\udf3b',
  cake: '\ud83c\udf82',
  cookie: '\ud83c\udf6a',
  chocolate: '\ud83c\udf6b',
  candy: '\ud83c\udf6c',
  ice: '\ud83e\uddca',
  cream: '\ud83c\udf66',
};

export function suggestEmoji(text: string): string | undefined {
  const lower = text.toLowerCase().trim();
  // Direct match
  if (EMOJI_SUGGESTIONS[lower]) return EMOJI_SUGGESTIONS[lower];
  // Partial match
  for (const [key, emoji] of Object.entries(EMOJI_SUGGESTIONS)) {
    if (lower.includes(key) || key.includes(lower)) return emoji;
  }
  return undefined;
}

export const QUICK_EMOJIS = [
  '\ud83c\udf45', '\ud83e\udd5b', '\ud83c\udf5e', '\ud83e\udd5a', '\ud83c\udf4e',
  '\ud83c\udf4c', '\ud83e\udd69', '\ud83c\udf57', '\ud83c\udf5a', '\ud83c\udf5d',
  '\u2615', '\ud83d\udca7', '\ud83d\udd11', '\ud83d\udcf1', '\ud83d\udd0c',
  '\ud83d\udcbb', '\ud83c\udfa7', '\ud83d\udc53', '\ud83d\udc8a', '\ud83d\udcd6',
  '\ud83c\udf81', '\ud83c\udf82', '\ud83c\udf6b', '\ud83e\udd52', '\ud83e\udd55',
];
