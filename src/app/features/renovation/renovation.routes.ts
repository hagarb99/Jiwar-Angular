
import { Routes } from '@angular/router';
import { Step1IntroComponent } from './components/step1-intro/step1-intro.component';
import { Step2DetailsComponent } from './components/step2-details/step2-details.component';
import { Step3MediaComponent } from './components/step3-media/step3-media.component';
import { Step4GoalsComponent } from './components/step4-goals/step4-goals.component';
import { Step5ResultsComponent } from './components/step5-results/step5-results.component';
import { Step6NextComponent } from './components/step6-next/step6-next.component';

export const RENOVATION_ROUTES: Routes = [
    { path: '', redirectTo: 'intro', pathMatch: 'full' },
    { path: 'intro', component: Step1IntroComponent },
    { path: 'details', component: Step2DetailsComponent },
    { path: 'media', component: Step3MediaComponent },
    { path: 'goals', component: Step4GoalsComponent },
    { path: 'results', component: Step5ResultsComponent },
    { path: 'next', component: Step6NextComponent }
];
