import { Component, Input } from '@angular/core';
import { MentorMessage } from '../../data/content';

/** A single "delivered" mentor message bubble in the hero stack. */
@Component({
  selector: 'wg-mentor-message-card',
  standalone: true,
  template: `
    <div class="msg" [style.margin-left.px]="message.offset ?? 0">
      <div class="msg-top">
        <span class="msg-ava" [style.background]="message.color" aria-hidden="true">{{ message.initial }}</span>
        <span>
          <span class="msg-name">{{ message.name }}</span><br>
          <span class="msg-role">{{ message.role }}</span>
        </span>
      </div>
      <p class="msg-body">{{ message.body }}</p>
      <p class="msg-time">{{ message.time }}</p>
    </div>
  `,
  styles: [`
    .msg {
      background: var(--surface);
      border: 1px solid var(--ink-08);
      border-radius: 18px;
      padding: 18px 20px;
      box-shadow: 0 1px 2px rgba(26, 23, 20, 0.03);
    }
    .msg-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .msg-ava {
      width: 34px; height: 34px; border-radius: 50%;
      display: grid; place-items: center; color: var(--cream);
      font-family: var(--mono); font-size: 13px; font-weight: 500;
    }
    .msg-name { font-weight: 600; font-size: 15px; }
    .msg-role { font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-40); white-space: nowrap; }
    .msg-body { font-family: var(--serif); font-style: italic; font-size: 18px; line-height: 1.45; color: var(--ink); margin: 0; }
    .msg-time { font-family: var(--mono); font-size: 11px; color: var(--ink-40); margin-top: 10px; }
  `],
})
export class MentorMessageCard {
  @Input({ required: true }) message!: MentorMessage;
}
