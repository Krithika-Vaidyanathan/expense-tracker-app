// src/app/components/nav-bar/nav-bar.component.ts
import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { User } from '../../components/types/user.type';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnDestroy {
  user: User | null = null;
  isAuthPage = false;

  private subs = new Subscription();

  constructor(public router: Router, public userService: UserService) {
    // subscribe to router events to detect /create-account
    const routeSub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.checkAuthRoute(ev.url);
      }
    });
    this.subs.add(routeSub);

    // subscribe to user observable
    const userSub = this.userService.user$.subscribe((u) => {
      this.user = u;
    });
    this.subs.add(userSub);
  }

  ngOnInit() {
    // ✅ Also check current URL on component init (for reload / mobile mode switch)
    this.checkAuthRoute(this.router.url);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async logout() {
    await this.userService.deleteUserAccount();
  }

  goHome() {
    this.router.navigateByUrl('/home');
  }

   private checkAuthRoute(url: string) {
    this.isAuthPage =
      url.includes('/create-account') ||
      url.includes('create-account');
  }
}
