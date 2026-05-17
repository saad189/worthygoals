import { Injectable } from '@nestjs/common';

@Injectable()
export class SafetyService {
  private static readonly KEYWORDS = [
    'hurt myself',
    'harm myself',
    'kill myself',
    'want to die',
    'suicid',
    'self harm',
    'self-harm',
    "i'm not okay",
    "im not okay",
    'give up on life',
    'end it all',
    "can't go on",
    'cant go on',
    'no reason to live',
    'better off dead',
    'not worth living',
  ];

  private static readonly CRISIS_RESPONSE =
    "It sounds like you might be having a really hard time right now. " +
    "Your wellbeing matters far more than any goal. " +
    "You don't have to be okay, and you don't have to go through this alone.\n\n" +
    "If you're in crisis, please reach out:\n" +
    "• Call or text 988 (Suicide & Crisis Lifeline)\n" +
    "• Text HOME to 741741 (Crisis Text Line)\n" +
    "• International: findahelpline.com";

  isCrisisSignal(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return SafetyService.KEYWORDS.some((kw) => lower.includes(kw));
  }

  getCrisisResponse(): string {
    return SafetyService.CRISIS_RESPONSE;
  }
}
