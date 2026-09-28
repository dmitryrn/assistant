export function contiguousPhrases(sentence: string): string[] {
  const trimmedSentence = sentence.trim();

  if (!trimmedSentence) {
    return [];
  }

  const tokens = trimmedSentence.split(/\s+/);
  const phrases: string[] = [];

  for (let start = 0; start < tokens.length; start += 1) {
    for (let end = start + 1; end <= tokens.length; end += 1) {
      phrases.push(tokens.slice(start, end).join(' '));
    }
  }

  return phrases;
}
