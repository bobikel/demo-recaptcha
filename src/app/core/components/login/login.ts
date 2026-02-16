import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RECAPTCHA_LOADER_OPTIONS, RECAPTCHA_SETTINGS, RecaptchaErrorParameters, RecaptchaFormsModule, RecaptchaLoaderOptions, RecaptchaModule } from 'ng-recaptcha-2';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth';

// Fonction globale pour parser la langue depuis l'URL
function parseLangFromHref(): string | null {
  try {
    // Récupérer l'URL complète
    const url = window.location.href;
    
    // Créer un objet URL pour parser facilement
    const urlObj = new URL(url);
    
    // Méthode 1: Vérifier le paramètre 'lang' dans la query string
    const langParam = urlObj.searchParams.get('lang');
    if (langParam) {
      return langParam.toLowerCase();
    }
    
    // Méthode 2: Vérifier le pathname pour un pattern comme /fr/page, /en/page
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0].toLowerCase();
      // Liste des codes de langue supportés
      const supportedLangs = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'];
      if (supportedLangs.includes(firstSegment)) {
        return firstSegment;
      }
    }
    
    // Méthode 3: Vérifier le hostname pour sous-domaines de langue
    const hostname = urlObj.hostname;
    const subdomain = hostname.split('.')[0];
    const supportedLangs = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'];
    if (supportedLangs.includes(subdomain.toLowerCase())) {
      return subdomain.toLowerCase();
    }
    
    // Méthode 4: Vérifier le hash pour un pattern comme #lang=fr
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.replace('#', ''));
      const hashLang = hashParams.get('lang');
      if (hashLang) {
        return hashLang.toLowerCase();
      }
    }
    
    // Si aucune langue n'est trouvée, retourner null
    return null;
    
  } catch (error) {
    console.error('Erreur lors du parsing de la langue depuis l\'URL:', error);
    return null;
  }
}

// Fonction pour obtenir la langue par défaut
function getDefaultLanguage(): string {
  // Essayer de récupérer la langue du navigateur
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang) {
    // Extraire le code de langue principal (ex: 'fr' from 'fr-FR')
    const langCode = browserLang.split('-')[0].toLowerCase();
    const supportedLangs = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'];
    if (supportedLangs.includes(langCode)) {
      return langCode;
    }
  }
  
  // Langue par défaut si rien n'est trouvé
  return 'en';
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ButtonModule, RecaptchaModule, RecaptchaFormsModule, FormsModule, ReactiveFormsModule],
  providers: [{
  provide: RECAPTCHA_SETTINGS,
  useValue: {
    siteKey: environment.recaptcha.siteKey
  }
}],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals pour l'état du composant
  recaptchaToken = signal<string | null>(null);
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  showCaptchaError = signal<boolean>(false);

  // URL de retour après login
  private returnUrl: string = '/dashboard';

  loginForm: FormGroup;
  showPassword: boolean = false;
  loading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      isUseLdap: [false]
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get isUseLdap() {
    return this.loginForm.get('isUseLdap');
  }
  
  onCaptchaResolved(token: string | null): void {
    console.log('Captcha résolu');
    this.recaptchaToken.set(token);
    this.showCaptchaError.set(false);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Appelé en cas d'erreur du captcha
   */
  onCaptchaError(error: any): void {
    console.error('Erreur captcha:', error);
    this.recaptchaToken.set(null);
    this.errorMessage.set('Erreur lors du chargement du captcha. Veuillez rafraîchir la page.');
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    // Réinitialiser les erreurs
    this.errorMessage.set('');
    this.showCaptchaError.set(false);

    // Vérifier que le formulaire est valide
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Vérifier que le captcha est résolu
    if (!this.recaptchaToken()) {
      this.showCaptchaError.set(true);
      return;
    }

    // Activer le loading
    this.isLoading.set(true);

    // Appeler le service d'authentification
    const { username, password } = this.loginForm.value;
    
    this.authService.login(username, password, this.recaptchaToken()!)
      .subscribe({
        next: (response) => {
          console.log('Login réussi:', response);
          this.isLoading.set(false);
          
          // Rediriger vers la page de retour
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          console.error('Erreur de login:', error);
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Erreur lors de la connexion');
          
          // Réinitialiser le captcha pour permettre une nouvelle tentative
          this.recaptchaToken.set(null);
        }
      });
  }
}