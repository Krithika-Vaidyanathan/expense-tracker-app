import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import * as echarts from 'echarts';  // ✅ import the ECharts engine

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';

export const appConfig: ApplicationConfig = {
   providers: [
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(HttpClientModule),
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts }, // ✅ moved here
    },
    provideZoneChangeDetection({ eventCoalescing: true })
  ],
};
