import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import * as echarts from 'echarts';  // ✅ import the ECharts engine

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // ✅ Provide ECharts globally for ngx-echarts
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: {
        echarts, // the instance you imported above
      },
    },
  ],
}).catch(err => console.error(err));