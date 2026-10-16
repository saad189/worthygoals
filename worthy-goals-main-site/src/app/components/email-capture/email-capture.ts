import { ChangeDetectionStrategy, Component, input, computed, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'wg-email-capture',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="capture" [style.max-width.px]="maxWidth()" (submit)="onSubmit($event)" novalidate>
      <!-- Visible, not sr-only: the placeholder was the only visible label and
           disappears on typing (WCAG 3.3.2). -->
      <label [for]="inputId()" class="field-label">Email address</label>
      <div class="capture-row">
        <!-- aria-invalid + aria-describedby tie the message to the input.
             Without them the alert is announced once and a screen reader
             returning to the field hears nothing about why it was rejected
             (WCAG 3.3.1); aria-describedby had 0 occurrences site-wide. -->
        <input
          [id]="inputId()"
          [formControl]="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          [placeholder]="copy.placeholder"
          [attr.aria-invalid]="message() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          required
        />
        <button type="submit" class="btn btn-primary" [disabled]="sending()">
          {{ sending() ? copy.sendingLabel : buttonLabel() }}
        </button>
      </div>
      <p [id]="messageId" class="form-msg" [class.error]="!!message()" role="alert" aria-live="polite">{{ message() }}</p>
      <p [id]="reassureId" class="reassure">{{ copy.reassure }}</p>
    </form>
  `,
  styles: [`
    .capture { margin-top: 34px; max-width: 480px; }
    .capture-row {
      display: flex;
      gap: 8px;
      background: var(--paper);
      border: 1px solid var(--ink-50);
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
    input::placeholder { color: var(--ink-64); }
    input:focus { outline: none; }
    .btn-primary { padding: 11px 22px; }
    .field-label { display: block; font-family: var(--mono); font-size: 12.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-64); margin: 0 2px 8px; }
    :host-context(.cta-band) .field-label { color: rgba(251, 247, 238, 0.72); }
    .reassure { font-size: 13.5px; color: var(--ink-64); margin: 13px 2px 0; font-family: var(--mono); letter-spacing: .01em; }
    .form-msg { font-size: 14px; margin: 10px 2px 0; min-height: 1.2em; }
    .form-msg.error { color: var(--rust-ink); }

    /* dark CTA-band treatment */
    :host-context(.cta-band) .capture-row { background: rgba(255, 255, 255, 0.10); border-color: rgba(255, 255, 255, 0.45); }
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
  readonly buttonLabel = input(CAPTURE.heroButton);
  /** Unique id so the label/input pair is valid when two forms share a page. */
  readonly inputId = input('email');
  /** Optional max-width override (px). */
  readonly maxWidth = input<number>();
  /** POST URL of your form provider; null simulates success. */
  readonly endpoint = input<string | null>(CAPTURE.subscribeUrl);

  readonly copy = CAPTURE;
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly sending = signal(false);
  readonly message = signal('');

  get messageId(): string {
    return `${this.inputId()}-message`;
  }

  get reassureId(): string {
    return `${this.inputId()}-reassure`;
  }

  /**
   * Point the input at its error when there is one, and at the reassurance
   * line otherwise — the helper text stays reachable instead of being
   * replaced by the error.
   */
  readonly describedBy = computed(() =>
    this.message() ? `${this.messageId} ${this.reassureId}` : this.reassureId,
  );

  constructor(private router: Router) {}

  onSubmit(event?: Event): void {
    // ponytail: native submit + preventDefault — only ReactiveFormsModule is
    // imported, so there's no NgForm to give us (ngSubmit); without this the
    // browser does a full-page GET submit and onSubmit never runs.
    event?.preventDefault();
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

    const endpoint = this.endpoint();
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
        // A hung Worker used to leave the button on "Sending…" forever:
        // sending() is only cleared by fail(), which a never-settling promise
        // never reaches.
        signal: AbortSignal.timeout(15_000),
      })
        .then((r) => { if (r.ok) succeed(); else fail(); })
        .catch(fail);
    } else {
      setTimeout(succeed, 650);
    }
  }
}
