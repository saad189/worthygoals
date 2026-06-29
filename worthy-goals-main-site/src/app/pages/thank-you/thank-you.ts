import { Component, signal } from '@angular/core';
import { Wordmark } from '../../components/wordmark/wordmark';
import { RevealDirective } from '../../shared/reveal.directive';
import { BRAND, THANK_YOU } from '../../data/content';

/** Post-signup confirmation: next steps, referral share, and a mentor teaser. */
@Component({
  selector: 'wg-thank-you',
  standalone: true,
  imports: [Wordmark, RevealDirective],
  templateUrl: './thank-you.html',
  styleUrl: './thank-you.scss',
})
export class ThankYou {
  readonly brand = BRAND;
  readonly content = THANK_YOU;
  readonly year = new Date().getFullYear();

  private readonly shareText = `${THANK_YOU.inviteText} ${BRAND.landingUrl}`;

  readonly copyLabel = signal(THANK_YOU.copyDefault);
  readonly copied = signal(false);
  readonly copyLive = signal('');

  private resetTimer?: ReturnType<typeof setTimeout>;

  get xHref(): string {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(THANK_YOU.inviteText)}&url=${encodeURIComponent(BRAND.landingUrl)}`;
  }

  get whatsAppHref(): string {
    return `https://wa.me/?text=${encodeURIComponent(this.shareText)}`;
  }

  async copyInvite(): Promise<void> {
    const done = () => {
      this.copied.set(true);
      this.copyLabel.set(this.content.copyDone);
      this.copyLive.set(this.content.copyLive);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => {
        this.copied.set(false);
        this.copyLabel.set(this.content.copyDefault);
      }, 2600);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(this.shareText);
        done();
        return;
      }
    } catch {
      /* fall through to legacy path */
    }
    this.fallbackCopy(done);
  }

  private fallbackCopy(done: () => void): void {
    const ta = document.createElement('textarea');
    ta.value = this.shareText;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch {
      this.copyLive.set('Press Ctrl/Cmd+C to copy.');
    }
    document.body.removeChild(ta);
  }
}
