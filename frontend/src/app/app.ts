import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ErrorBanner } from './core/error-banner';
import { Icon } from './core/icon';
import { Toast } from './core/toast';

@Component({
  selector: 'app-root',
  imports: [ErrorBanner, Toast, Icon, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
