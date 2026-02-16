import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RECAPTCHA_LOADER_OPTIONS, RECAPTCHA_SETTINGS, RecaptchaErrorParameters, RecaptchaFormsModule, RecaptchaLoaderOptions, RecaptchaModule } from 'ng-recaptcha-2';
import { ConfigService } from '../../services/config-service';
import { environment } from '../../../../environments/environment';
import { FormsModule, NgForm } from '@angular/forms';

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
  imports: [CommonModule, ButtonModule, RecaptchaModule, RecaptchaFormsModule, FormsModule],
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
  token: string|undefined;

  showPassword: boolean = false;
  loading = signal(false);

  constructor() {
    console.log(environment.recaptcha.siteKey);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password';
    }
  }

  load() {
    this.loading.set(true);
    
    setTimeout(() => {
      this.loading.set(false);
        }, 2000);
    }

  public resolved(form: NgForm): void {
    if (form.invalid) {
      for (const control of Object.keys(form.controls)) {
        form.controls[control].markAsTouched();
      }
      return;
    }

    console.debug(`Token [${this.token}] generated`);
  }

  public onError(errorDetails: RecaptchaErrorParameters): void {
    console.log(`reCAPTCHA error encountered; details:`, errorDetails);
  }

  /**
   * Extrait la langue depuis l'URL de la page actuelle
   * @returns string - Code de langue (ex: 'fr', 'en', 'es') ou langue par défaut
   */
  getLanguageFromUrl(): string {
    const lang = parseLangFromHref();
    return lang || getDefaultLanguage();
  }
}

