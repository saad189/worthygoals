import { Injectable } from '@nestjs/common';

@Injectable()
export class SafetyService {
  // Matched against normalize(text): lowercase, apostrophes dropped, whitespace
  // collapsed — so write keywords without apostrophes ("cant", not "can't").
  // ponytail: substring list, misses novel phrasings; an LLM classifier is the
  // upgrade path. A false positive only shows resources, so err broad.
  private static readonly KEYWORDS = [
    'hurt myself',
    'harm myself',
    'kill myself',
    'want to die',
    'suicid',
    'self harm',
    'self-harm',
    'im not ok',
    'give up on life',
    'end it all',
    'cant go on',
    'no reason to live',
    'better off dead',
    'not worth living',
    'dont want to be alive',
    'dont want to live',
    'dont want to be here anymore',
    'want to be dead',
    'wish i was dead',
    'wish i were dead',
    'rather be dead',
    'end my life',
    'take my life',
    'no point in living',
  ];

  // iOS smart punctuation types ’ (U+2019), not ', so "I’m not okay" from a
  // phone never matched "i'm not okay". Drop every apostrophe variant instead.
  private static normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/['‘’ʼ`´]/g, '')
      .replace(/\s+/g, ' ');
  }

  private static readonly CRISIS_RESPONSE =
    'It sounds like you might be having a really hard time right now. ' +
    'Your wellbeing matters far more than any goal. ' +
    "You don't have to be okay, and you don't have to go through this alone.\n\n" +
    "If you're in crisis, please reach out:\n" +
    '• Call or text 988 (Suicide & Crisis Lifeline)\n' +
    '• Text HOME to 741741 (Crisis Text Line)\n' +
    '• International: findahelpline.com';

  isCrisisSignal(text: string): boolean {
    if (!text) return false;
    const norm = SafetyService.normalize(text);
    return SafetyService.KEYWORDS.some((kw) => norm.includes(kw));
  }

  getCrisisResponse(): string {
    return SafetyService.CRISIS_RESPONSE;
  }
}
