import { contiguousPhrases } from '../src/lib/contiguous-phrases';

function printPhrases(sentence: string): void {
  const phrases = contiguousPhrases(sentence);

  console.log(`\n${sentence}`);
  console.log(`Count: ${phrases.length}`);

  for (const [index, phrase] of phrases.entries()) {
    console.log(`${index + 1}. ${phrase}`);
  }
}

printPhrases('Set alarm at 15 for landlord');
printPhrases('Alarm 15 for landlord is coming');
