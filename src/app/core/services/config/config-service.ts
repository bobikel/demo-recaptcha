import { Injectable } from '@angular/core';
import {  RecaptchaSettings } from 'ng-recaptcha-2';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  /**
   * Configuration par défaut du reCAPTCHA
   */
  private readonly defaultConfig: RecaptchaSettings = {
    siteKey: '', // À configurer dans les providers
  };

  /**
   * Retourne la configuration du reCAPTCHA
   */
  getConfig(): RecaptchaSettings {
    return this.defaultConfig;
  }

  /**
   * Met à jour la clé du site
   */
  setSiteKey(siteKey: string): void {
    this.defaultConfig.siteKey = siteKey;
  }
}

/**
 * Factory pour créer la configuration reCAPTCHA
 */
export function recaptchaConfigFactory(siteKey: string): RecaptchaSettings {
  return {
    siteKey: siteKey,
  };
}
