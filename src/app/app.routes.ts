import { Routes } from '@angular/router';
import { Login } from './core/components/login/login';
import { Register } from './core/components/register/register';

export const routes: Routes = [
    {
        path:"",
        component: Login,
        pathMatch: "full"

    },
    {
        path:"register",
        component: Register,
    }
];
