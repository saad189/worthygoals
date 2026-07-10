import { Component, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CAPTURE } from '../../data/content';

/**
 * Waitlist email capture. Validates the address, shows a sending state,
 * then routes to the thank-you page on success.
 *
 * Wire a real provider by setting `endpoint` (Formspree/Tally/etc.);
 * when null, success is simulated so the flow can be demoed.
 */
@Component({
  selector: 'wg-email-capture',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="capture" [style.max-width.px]="maxWidth" (ngSubmit)="onSubmit()" novalidate>
      <div class="capture-row">
        <label [for]="inputId" class="sr-only">Email address</label>
        <input
          [id]="inputId"
          [formControl]="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          [placeholder]="copy.placeholder"
          required
        />
        <button type="submit" class="btn btn-primary" [disabled]="sending()">
          {{ sending() ? copy.sendingLabel : buttonLabel }}
        </button>
      </div>
      <p class="form-msg" [class.error]="!!message()" role="alert" aria-live="polite">{{ message() }}</p>
      <p class="reassure">{{ copy.reassure }}</p>
    </form>
  `,
  styles: [`
    .capture { margin-top: 34px; max-width: 480px; }
    .capture-row {
      display: flex;
      gap: 8px;
      background: var(--paper);
      border: 1px solid var(--ink-12);
      border-radius: 14px;
      padding: 7px;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .capture-row:focus-within { border-color: var(--rust); box-shadow: 0 0 0 3px rgba(192, 65, 36, 0.12); }
    input[type=email] {
      flex: 1;
      border: none;
      background: transparent;
      font-family: var(--sans);
      font-size: 16px;
      color: var(--ink);
      padding: 11px 12px;
      min-width: 0;
    }
    input::placeholder { color: var(--ink-40); }
    input:focus { outline: none; }
    .btn-primary { padding: 11px 22px; }
    .reassure { font-size: 13.5px; color: var(--ink-55); margin: 13px 2px 0; font-family: var(--mono); letter-spacing: .01em; }
    .form-msg { font-size: 14px; margin: 10px 2px 0; min-height: 1.2em; }
    .form-msg.error { color: var(--rust-ink); }

    /* dark CTA-band treatment */
    :host-context(.cta-band) .capture-row { background: rgba(255, 255, 255, 0.10); border-color: rgba(255, 255, 255, 0.28); }
    :host-context(.cta-band) .capture-row:focus-within { border-color: var(--cream); box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.18); }
    :host-context(.cta-band) input[type=email] { color: var(--cream); }
    :host-context(.cta-band) input::placeholder { color: rgba(251, 247, 238, 0.6); }
    :host-context(.cta-band) .btn-primary { background: var(--cream); color: var(--rust-ink); }
    :host-context(.cta-band) .btn-primary:hover { background: #fff; }
    :host-context(.cta-band) .reassure { color: rgba(251, 247, 238, 0.72); }
    :host-context(.cta-band) .form-msg.error { color: #FFE2DA; }
  `],
})
export class EmailCapture {
  /** Submit button label. */
  @Input() buttonLabel = CAPTURE.heroButton;
  /** Unique id so the label/input pair is valid when two forms share a page. */
  @Input() inputId = 'email';
  /** Optional max-width override (px). */
  @Input() maxWidth?: number;
  /** POST URL of your form provider; null simulates success. */
  @Input() endpoint: string | null = CAPTURE.subscribeUrl;

  readonly copy = CAPTURE;
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly sending = signal(false);
  readonly message = signal('');

  constructor(private router: Router) {}

  onSubmit(): void {
    this.message.set('');
    const value = this.email.value.trim();
    if (this.email.invalid || !value) {
      this.message.set(this.copy.invalidMsg);
      return;
    }

    this.sending.set(true);
    const succeed = () => { void this.router.navigate(['/thank-you']); };
    const fail = () => {
      this.sending.set(false);
      this.message.set(this.copy.errorMsg);
    };

    if (this.endpoint) {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
        .then((r) => { if (r.ok) succeed(); else fail(); })
        .catch(fail);
    } else {
      setTimeout(succeed, 650);
    }
  }
}
