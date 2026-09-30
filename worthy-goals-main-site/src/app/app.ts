import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  skipToMain(event: Event): void {
    event.preventDefault();
    document.querySelector<HTMLElement>('main')?.focus();
  }
}
