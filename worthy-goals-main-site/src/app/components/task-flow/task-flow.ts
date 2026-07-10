import { Component } from '@angular/core';
import { RevealDirective } from '../../shared/reveal.directive';

/**
 * "The Loop" — a goal becomes a task, hits a deadline, and forks two ways:
 * the quiet success ending, or the reframe where a miss starts a conversation.
 * Ported from the Claude Design "Task Flow Section" prototype.
 *
 * ponytail: bespoke one-off narrative section, copy lives inline rather than in
 * content.ts — the structure is too irregular to data-drive cheaply. Move to
 * content.ts if this copy needs to be edited by non-devs.
 */
@Component({
  selector: 'wg-task-flow',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './task-flow.html',
  styleUrl: './task-flow.scss',
})
export class TaskFlow {}
