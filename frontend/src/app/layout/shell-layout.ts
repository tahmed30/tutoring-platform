import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { AuthStore } from '../state/auth.store';
import { SettingsStore } from '../state/settings.store';
import { NotificationsStore } from '../state/notifications.store';
import { MessagesStore } from '../state/messages.store';
import { RoleName } from '../core/models';

interface NavItem {
  labelKey: string;
  route: string;
  icon: string;
  roles?: RoleName[];
}

@Component({
  selector: 'app-shell-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayoutComponent {
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  readonly authStore = inject(AuthStore);
  readonly settings = inject(SettingsStore);
  readonly notifications = inject(NotificationsStore);
  readonly messages = inject(MessagesStore);

  readonly sidenav = viewChild<MatSidenav>('drawer');

  private readonly isHandset = toSignal(
    this.breakpoint.observe(Breakpoints.Handset).pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly mode = computed(() => (this.isHandset() ? 'over' : 'side'));
  readonly opened = computed(() => !this.isHandset());

  private readonly allNav: NavItem[] = [
    { labelKey: 'nav.dashboard', route: '/dashboard', icon: 'dashboard' },
    { labelKey: 'nav.courses', route: '/courses', icon: 'school' },
    { labelKey: 'nav.attendance', route: '/attendance', icon: 'event_available' },
    { labelKey: 'nav.gradebook', route: '/gradebook', icon: 'grade' },
    { labelKey: 'nav.assignments', route: '/assignments', icon: 'assignment' },
    { labelKey: 'nav.messages', route: '/messages', icon: 'mail' },
    { labelKey: 'nav.notifications', route: '/notifications', icon: 'notifications' },
    {
      labelKey: 'nav.payments',
      route: '/payments',
      icon: 'payments',
      roles: ['PARENT', 'ADMIN'],
    },
    {
      labelKey: 'nav.adminUsers',
      route: '/admin/users',
      icon: 'manage_accounts',
      roles: ['ADMIN'],
    },
  ];

  readonly navItems = computed(() => {
    const role = this.authStore.primaryRole();
    return this.allNav
      .map((item) => {
        if (item.route === '/dashboard' && role) {
          return {
            ...item,
            route: this.authService.dashboardPathForRole(role),
          };
        }
        return item;
      })
      .filter((item) => !item.roles || (role && item.roles.includes(role)));
  });

  readonly languageLabel = signal('EN / አማ');

  onNavClick(): void {
    if (this.isHandset()) {
      void this.sidenav()?.close();
    }
  }

  toggleLanguage(): void {
    this.settings.toggleLanguage();
    this.authService.syncPreferredLanguage();
  }

  logout(): void {
    this.authService.logout();
  }
}
