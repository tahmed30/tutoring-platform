import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-dashboard-redirect',
  template: '',
})
export class DashboardRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigateByUrl(this.auth.dashboardPathForRole(this.store.primaryRole()));
  }
}
