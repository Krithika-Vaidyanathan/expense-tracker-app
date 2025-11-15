// src/app/components/nav-bar/nav-bar.component.ts
import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { User } from '../../components/types/user.type';
import { PopupComponent } from '../popup/popup.component';
import { FeedbackDialogComponent } from '../feedback-dialog/feedback-dialog.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, PopupComponent, FeedbackDialogComponent],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnDestroy {
  user: User | null = null;
  isAuthPage = false;
  showDeletePopup = false;
  deletePopupMessage = '';
  showMenu = false;
  showFeedbackModal = false;

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

  confirmDeleteUser() {
    this.deletePopupMessage =
      'This action will permanently delete your account, budgets, and expenses. Are you sure?';
    this.showDeletePopup = true;
  }

  async deleteUserPermanently() {
    try {
      await this.userService.deleteUserCompletely();  // NEW service method
    } catch (err) {
      console.error('Account deletion failed:', err);
    } finally {
      console.log("User account deleted successfully...");
      this.showDeletePopup = false;
    }
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

  openFeedbackModal() {
    this.showFeedbackModal = true;
  }
}
