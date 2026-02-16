import { Routes } from '@angular/router';
import { Login } from './core/components/login/login';
import { Register } from './core/components/register/register';
import { Dashboard } from './core/components/dashboard/dashboard';

export const routes: Routes = [
    {
        path:"",
        redirectTo: "dashboard",
        pathMatch: "full"

    },
    {
        path:"login",
        component: Login,
        pathMatch: "full"

    },
    {
        path:"register",
        component: Register,
    },
    {
        path:"dashboard",
        component: Dashboard,
    }

];
