import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './analytics/sidebar/sidebar.component';
import { RaceSelectorComponent } from './analytics/race-selector/race-selector.component';
import {AppComponent} from "./app.component";
import { AnalyzingAppComponent } from './analytics/analyzing-app/analyzing-app.component';
import { RaceSelectorPanelComponent } from './analytics/race-selector-panel/race-selector-panel.component';
import {CdkTableModule} from "@angular/cdk/table";
import {MatTableModule} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSortModule} from "@angular/material/sort";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import { OverviewComponent } from './overview/overview.component';
import { RouterModule, Routes } from "@angular/router";
import { AnalyticsComponent } from './analytics/analytics.component';
import { AccountComponent } from './account/account.component';

const myRoutes: Routes = [
  {path: '', component: OverviewComponent},
  {path: 'analytics', component: AnalyticsComponent},
  {path: 'account', component: AccountComponent}
]

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    RaceSelectorComponent,
    AnalyzingAppComponent,
    RaceSelectorPanelComponent,
    OverviewComponent,
    AnalyticsComponent,
    AccountComponent
  ],
    imports: [
        RouterModule.forRoot(myRoutes),
        BrowserModule,
        AppRoutingModule,
        CdkTableModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatProgressSpinnerModule,
        FormsModule,
        HttpClientModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
