import {
  Observable,
  ObservableCallback,
  observableFactory,
} from '@/observable';
import {
  buildPropertyDecorator,
  getDecoratedProperties,
} from '@/resources/decorators';
import * as defaultTranslations from '@/translations';
import { Logger } from '@logger';
import { Session as session } from '@session/index';
import { defaultStr } from '@utils/defaultStr';
import { interpolate } from '@utils/interpolate';
import { isNonNullString } from '@utils/isNonNullString';
import { isNullable } from '@utils/isNullable';
import { isPrimitive } from '@utils/isPrimitive';
import { extendObj, isObj } from '@utils/object';
import { stringify } from '@utils/stringify';
import {
  Dict,
  I18n as I18nJs,
  I18nOptions,
  Scope,
  TranslateOptions,
} from 'i18n-js';
import moment, { LocaleSpecification } from 'moment';
import 'reflect-metadata';
import { I18nEvent, I18nTranslation } from '../types/i18n';
import { Dictionary } from '../types/index';
/**
 * A key to store metadata for translations.
 */
const TRANSLATION_KEY = Symbol('TRANSLATION_KEY');

/**
* A decorator to attach metadata to properties or methods for translation.
* @param key The translation key in the translations.
* @returns A property and method decorator.
* @example 
* ```ts
*   // Class with translations using the decorator
    class MyComponent {
        @Translate("greeting")
        public greeting: string;

        @Translate("nested.example")
        public nestedExample: string;

        @Translate("farewell")
        public sayGoodbye(): string {
            return "";
        }
    }
* ```
*/
export function Translate(key: string): PropertyDecorator & MethodDecorator {
  return buildPropertyDecorator<string>(TRANSLATION_KEY, key);
}

/**
 * The I18n class extends the i18n-js library to provide internationalization (i18n)
 * functionality with observable capabilities. It manages translations, allows for
 * dynamic loading of language dictionaries, and supports event-driven architecture
 * through observable patterns.
 *
 * @extends I18nJs
 * @implements Observable<I18nEvent>
 *
 * @example
 * // Example usage of the I18n class
 * const i18nInstance = I18n.getInstance();
 * i18nInstance.registerTranslations({
 *   en: {
 *     greeting: "Hello, %{name}!",
 *     farewell: "Goodbye!",
 *   },
 * });
 * console.log(i18nInstance.translate("greeting", { name: "John" })); // Outputs: Hello, John!
 * @see https://www.npmjs.com/package/i18n-js?activeTab=readme for more information on i18n-js library.
 */
export class I18n extends I18nJs implements Observable<I18nEvent> {
  /**
   * Custom instanceof check. When consumers import `I18n` from built packages or
   * across module boundaries, class identity can differ. Using Symbol.hasInstance
   * allows `instanceof I18n` to succeed if the object has the required i18n API
   * shape (duck typing). This preserves `instanceof` checks externally while
   * keeping the current exported API intact.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static [Symbol.hasInstance](obj: any) {
    return this.isI18nInstance(obj);
  }
  /**
   * Type guard to check if an object is an instance of I18n.
   * Uses duck typing to verify the object has the required i18n methods,
   * allowing for cross-realm compatibility when instanceof checks fail.
   * @param obj The object to check.
   * @returns True if the object is an I18n instance, false otherwise.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isI18nInstance(obj: any): obj is I18n {
    if (!obj || typeof obj !== 'object') return false;
    // If it's an actual instance of the native i18n-js class, consider true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (obj instanceof (I18nJs as any)) return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // ignore cross-realm issues
    }
    // Fallback to duck-typing verification: check for i18n-like methods used in the codebase
    return (
      typeof obj.getLocale === 'function' &&
      typeof obj.translate === 'function' &&
      typeof obj.translateTarget === 'function'
    );
  }
  /**
   * Translates the given scope with the provided options.
   * If the scope is a string and the options include pluralization, the method will pluralize the translation.
   * Otherwise, it will call the parent `translate` method.
   * @param scope The translation scope.
   * @param options The translation options, including pluralization.
   * @returns The translated string or the type specified in the generic parameter.
   * @example
   * // Register translations for the "en" locale.
   * i18n.registerTranslations({
   *   en: {
   *     greeting: {
   *       one: "Hello, %{name}!",
   *       other: "Hello, %{name}s!",
   *       zero: "Hello, %{name}s!"
   *     },
   *     farewell: "Goodbye!"
   *   }
   * });
   *
   * // Translate the "greeting" scope with pluralization.
   * i18n.translate("greeting", { count: 1 }); // "Hello, John!"
   * i18n.translate("greeting", { count: 2 }); // "Hello, Johns!"
   * i18n.translate("greeting", { count: 0 }); // "Hello, Johns!"
   *
   * // Translate the "farewell" scope.
   * i18n.translate("farewell"); // "Goodbye!"
   */
  translate<T = string>(scope: Scope, options?: TranslateOptions) {
    if (this.isPluralizeOptions(options) && this.canPluralize(scope)) {
      if (typeof options.count === 'number') {
        options.countStr = options.count.formatNumber();
      }
      return this.pluralize(options.count as number, scope, options);
    }
    return super.translate<T>(scope, options);
  }
  /***
   * Translates the keys of the given target class.
   * @param target The target class.
   * @param options The translation options.
   * @returns The translated keys.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  translateTarget<T extends { new (...args: any[]): {} } = any>(
    target: T,
    options?: TranslateOptions
  ): Record<keyof T, string> {
    const translationKeys = I18n.getTargetTanslationKeys(target);
    for (let i in translationKeys) {
      if (isNonNullString(translationKeys[i])) {
        translationKeys[i] = this.translate(translationKeys[i], options);
      }
    }
    return translationKeys;
  }
  /**
   * Translates an object containing translation keys as values.
   * This method takes an object where each property value is expected to be a translation key,
   * and returns a new object with the same structure but with translated values.
   *
   * @template T - The type of the input object, extending Record<string, string>
   * @param object - The object containing translation keys as values to be translated
   * @param {TranslateOptions} options - additional options to pass to the i18n.translate function
   * @returns A new object with the same keys but translated values
   *
   * @example
   * ```typescript
   * // Register translations first
   * i18n.registerTranslations({
   *   en: {
   *     'user.name': 'Name',
   *     'user.email': 'Email Address',
   *     'user.phone': 'Phone Number',
   *     'actions.save': 'Save',
   *     'actions.cancel': 'Cancel'
   *   },
   *   fr: {
   *     'user.name': 'Nom',
   *     'user.email': 'Adresse Email',
   *     'user.phone': 'Numéro de Téléphone',
   *     'actions.save': 'Enregistrer',
   *     'actions.cancel': 'Annuler'
   *   }
   * });
   *
   * // Define an object with translation keys
   * const formLabels = {
   *   name: 'user.name',
   *   email: 'user.email',
   *   phone: 'user.phone'
   * };
   *
   * // Translate the object
   * const translatedLabels = i18n.translateObject(formLabels);
   * console.log(translatedLabels);
   * // Output (for 'en' locale): { name: 'Name', email: 'Email Address', phone: 'Phone Number' }
   * // Output (for 'fr' locale): { name: 'Nom', email: 'Adresse Email', phone: 'Numéro de Téléphone' }
   *
   * // Can also be used with button configurations
   * const buttonConfig = {
   *   saveButton: 'actions.save',
   *   cancelButton: 'actions.cancel'
   * };
   * const translatedButtons = i18n.translateObject(buttonConfig);
   * // Output (for 'en' locale): { saveButton: 'Save', cancelButton: 'Cancel' }
   * ```
   *
   * @example
   * ```typescript
   * // Advanced usage with form validation messages
   * const validationMessages = {
   *   required: 'validation.required',
   *   email: 'validation.email.invalid',
   *   minLength: 'validation.minLength',
   *   maxLength: 'validation.maxLength'
   * };
   *
   * // Assuming you have registered validation translations
   * const translatedValidation = i18n.translateObject(validationMessages);
   * // This allows you to easily get all validation messages in the current locale
   * ```
   *
   * @note If the input object is not a valid object, an empty object of type T is returned.
   * @note Only string values that are non-null and non-empty are translated; other values are skipped.
   * @note This method is particularly useful for translating configuration objects, form labels,
   *       button texts, or any structured data containing translation keys.
   *
   * @see {@link translateTarget} for translating class properties decorated with @Translate
   * @see {@link t} for translating individual keys with interpolation support
   *
   * @since 1.20.3
   */
  translateObject<T extends Record<string, string>>(
    object: T,
    options?: TranslateOptions
  ): T {
    if (!isObj(object)) return {} as T;
    const translatedKeys: T = {} as T;
    for (const key in object) {
      const i18nKey = object[key];
      if (isNonNullString(i18nKey)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (translatedKeys as any)[key] = i18n.translate(i18nKey, options);
      }
    }
    return translatedKeys;
  }
  /***
   * returns the translation keys for the target class
   * @param target the target class
   * @returns the translation keys for the target class
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  static getTargetTanslationKeys<T extends { new (...args: any[]): {} } = any>(
    target: T
  ): Record<keyof T, string> {
    return getDecoratedProperties(target, TRANSLATION_KEY);
  }
  private _isLoading: boolean = false;
  /***
   * locales that are superted by the i18n instance
   */
  private _locales: string[] = [];
  /**
   * Namespace resolvers for loading translations.
   */
  private namespaceResolvers: Record<
    string,
    (locale: string) => Promise<I18nTranslation>
  > = {};
  /**
   * Singleton instance of the I18n class.
   */
  private static instance: I18n;

  /**
   * Creates an instance of the I18n class.
   * @param options Optional configuration options for the I18n instance.
   */
  constructor(
    translations: I18nTranslation = {},
    options: Partial<I18nOptions> = {}
  ) {
    super({}, options);
    if (!this.hasRegisteredDefaultTranslations) {
      this.registerTranslations(defaultTranslations);
      this.hasRegisteredDefaultTranslations = true;
    }
    this.registerTranslations(translations);
    this.loadNamespaces();
  }
  readonly _observableFactory = observableFactory<I18nEvent>();
  readonly _____isObservable?: boolean | undefined = true;
  /**
   * Subscribes a callback function to a specific event.
   * @param event The event name to listen for.
   * @param fn The callback function to be invoked when the event is triggered.
   * @returns An object containing a remove method to unsubscribe from the event.
   */
  on(event: I18nEvent, fn: ObservableCallback) {
    return this._observableFactory.on.call(this, event, fn);
  }
  /**
   * Registers a callback to be invoked finally when an event is triggered.
   * @param event The event name.
   * @param fn The callback function to be invoked.
   * @returns The observable instance.
   */
  finally(event: I18nEvent, fn: ObservableCallback) {
    return this._observableFactory.finally.call(this, event, fn);
  }
  /**
   * Unsubscribes a callback from a specific event.
   * @param event The event name.
   * @param fn The callback function to remove.
   * @returns The observable instance.
   */
  off(event: I18nEvent, fn: ObservableCallback) {
    return this._observableFactory?.off.call(this, event, fn);
  }
  /**
   * Triggers a specific event with optional arguments.
   * @param event The event name to trigger.
   * @param args Optional arguments to pass to the event callbacks.
   * @returns The observable instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger(event: I18nEvent | '*', ...args: any[]) {
    return this._observableFactory?.trigger.call(this, event, ...args);
  }
  /**
   * Unsubscribes all event callbacks for this component.
   * @returns The observable instance.
   */
  offAll(): Observable<I18nEvent> {
    return this._observableFactory?.offAll.call(this);
  }
  /**
   * Subscribes a callback function to be triggered once for a specific event.
   * @param event The event name.
   * @param fn The callback function to be invoked.
   * @returns An object containing a remove method to unsubscribe from the event.
   */
  once(event: I18nEvent, fn: ObservableCallback) {
    return this._observableFactory?.once.call(this, event, fn);
  }
  /**
   * Retrieves all registered event callbacks.
   * @returns An object mapping event names to their respective callback functions.
   */
  getEventCallBacks() {
    return this._observableFactory?.getEventCallBacks.call(this);
  }
  /**
   * Retrieves the singleton instance of the I18n class.
   * @returns The singleton I18n instance.
   */
  static getInstance(options?: I18nOptions): I18n {
    if (!this.isI18nInstance(I18n.instance)) {
      const locale = I18n.getLocaleFromSession();
      I18n.instance = this.createInstance(
        {},
        Object.assign({}, locale ? { locale } : {}, options)
      );
    }
    return I18n.instance;
  }
  /***
   * returns true if the instance is the default instance.
   * @returns true if the instance is the default instance.
   */
  isDefaultInstance() {
    return this === I18n.instance;
  }
  private static setLocaleToSession(locale: string) {
    session.set('i18n.locale', locale);
  }
  static getLocaleFromSession() {
    const locale = session.get('i18n.locale');
    if (isNonNullString(locale)) {
      return locale;
    }
    return '';
  }
  /**
   * Checks if the provided translation key can be pluralized for the given locale.
   * @param scope The translation scope to check.
   * @param locale The locale to use for the check. If not provided, the current locale is used.
   * @returns `true` if the translation key can be pluralized, `false` otherwise.
   * @note This method is useful for determining if a translation key can be pluralized for a specific locale.
   * A translation key can be pluralized if it has pluralization rules defined in the translation dictionary.
   * The pluralization rules are defined in the `one`, `other`, and `zero` properties of the translation dictionary.
   * @example
   * //register a translation dictionary for the "en" locale.
   * i18n.registerTranslations({
   *   en: {
   *     greeting: {
   *       one: "Hello, {name}!",
   *       other: "Hello, {name}s!",
   *       zero: "Hello, {name}s!"
   *     },
   *     farewell: "Goodbye!"
   *   }
   * );
   * });
   * // Check if the translation key "greeting" can be pluralized for the current locale.
   * i18n.canPluralize("greeting");
   *
   * // Check if the translation key "greeting" can be pluralized for the "en" locale.
   * i18n.canPluralize("greeting", "en");
   * i18n.canPluralize("greeting", "fr"); // returns false
   * i18n.canPluralize("farewell", "en"); // returns false
   */
  canPluralize(scope: Scope, locale?: string) {
    locale = defaultStr(locale, this.getLocale());
    const r = this.getNestedTranslation(scope, locale) as Dictionary;
    if (!isObj(r) || !r) return false;
    return isNonNullString(r?.one) && isNonNullString(r?.other); //&& isNonNullString(r?.zero);
  }
  /**
   * Resolves translation for nested keys.
   * @param scope {Scope} The translation scope.
   * @param locale The locale to use for translation.
   * @returns The translated string or undefined if not found.
   * @example
   * // Register translations for the "en" locale.
   * i18n.registerTranslations({
   *   en: {
   *     greeting: {
   *       one: "Hello, {name}!",
   *       other: "Hello, {name}s!",
   *       zero: "Hello, {name}s!"
   *     },
   *     farewell: "Goodbye!"
   *   }
   * });
   *
   * // Resolve translation for the "greeting" key.
   * i18n.getNestedTranslation("greeting.one", "en");
   *
   * // Resolve translation for the "greeting" key.
   * i18n.getNestedTranslation("greeting.other", "en");
   *
   * // Resolve translation for the "greeting" key.
   * i18n.getNestedTranslation("en", "greeting.zero", 0);
   *
   * // Resolve translation for the "farewell" key.
   * i18n.getNestedTranslation("en", "farewell");
   */
  getNestedTranslation(
    scope: Scope,
    locale?: string
  ): string | Dictionary | undefined {
    locale = defaultStr(locale, this.getLocale());
    const scopeArray = isNonNullString(scope)
      ? scope.trim().split('.')
      : Array.isArray(scope)
        ? scope
        : [];
    if (!scopeArray.length) return undefined;
    let result = this.getTranslations(locale);
    for (const k of scopeArray) {
      if (isObj(result)) {
        result = result[k];
      } else {
        return undefined;
      }
    }
    return result;
  }
  /**
   * Checks if the provided `TranslateOptions` object has a `count` property of type `number`.
   * This is used to determine if the translation should be pluralized based on the provided count.
   * @param options The `TranslateOptions` object to check.
   * @returns `true` if the `options` object has a `count` property of type `number`, `false` otherwise.
   */
  isPluralizeOptions(options?: TranslateOptions): options is TranslateOptions {
    return !!(isObj(options) && options && typeof options.count === 'number');
  }
  /**
     * static function to attach translations to the I18n default instance.
        @example : 
        // --- Usage as a decorator ---
        I18n.RegisterTranslations({
            de: {
                greeting: "Hallo, {name}!",
                farewell: "Auf Wiedersehen!",
            },
        })
    * @param translations The language translations.
    */
  static RegisterTranslations(translations: I18nTranslation): I18nTranslation {
    return I18n.getInstance().registerTranslations(translations);
  }

  /**
   * Factory method to create I18n instances dynamically.
   * @param options Optional configuration options for the I18n instance.
   * @returns A new I18n instance.
   */
  static createInstance(
    translations: I18nTranslation = {},
    options: Partial<I18nOptions> & {
      interpolate?: (i18n: I18nJs, str: string, params: Dictionary) => string;
    } = {}
  ): I18n {
    const { interpolate: i18nInterpolate, ...restOptions } = Object.assign(
      {},
      options
    );
    const i18n = new I18n(translations, restOptions);
    i18n.interpolate = (i18n: I18nJs, str: string, params: Dictionary) => {
      const flattenParams = I18n.flattenObject(params);
      const formattedValue = this.defaultInterpolator(i18n, str, flattenParams);
      if (isNonNullString(formattedValue) && formattedValue !== str) {
        str = formattedValue;
      }
      if (typeof i18nInterpolate == 'function') {
        return i18nInterpolate(i18n, str, params);
      }
      return interpolate(str, params);
    };
    return i18n;
  }

  /**
   * Gets the translations for the specified locale, or all translations if no locale is provided.
   * @param locale The locale to get translations for. If not provided, returns all translations.
   * @returns The translations for the specified locale, or all translations if no locale is provided.
   * @example
   * // Get all translations
   * const translations = i18n.getTranslations();
   * console.log(translations);
   *
   * // Get translations for the "en" locale
   * const enTranslations = i18n.getTranslations("en");
   * console.log(enTranslations);
   */
  getTranslations(locale?: string) {
    const r = isObj(this.translations) ? this.translations : {};
    if (isNonNullString(locale)) {
      return isObj(r[locale]) ? r[locale] : {};
    }
    return r;
  }
  /***
   * list of registered moment locales
   */
  private static momentLocales: Record<string, LocaleSpecification> = {};
  private hasRegisteredDefaultTranslations: boolean = false;
  /***
   * register a moment locale
   * @param {string} locale
   * @param {LocaleSpecification} momentLocale
   * @see https://momentjs.com/docs/#/customization/ for more information on customizing moment locales
   * @see https://momentjs.com/docs/#/i18n/ for more information on moment locales
   * @returns
   */
  static registerMomentLocale(
    locale: string,
    momentLocale: LocaleSpecification
  ): Record<string, LocaleSpecification> {
    if (
      isNonNullString(locale) &&
      isObj(momentLocale) &&
      Array.isArray(momentLocale.months)
    ) {
      this.momentLocales[locale] = extendObj(
        {},
        this.momentLocales[locale],
        momentLocale
      );
    }
    return this.momentLocales;
  }
  /***
   * get a registered moment locale
   * @param {string} locale
   * @returns {LocaleSpecification}
   */
  static getMomentLocale(locale: string): LocaleSpecification {
    return this.momentLocales[locale];
  }
  /***
   * set a moment locale. the locale is picked from the momentLocales list
   * @param {string} locale
   * @param {Moment} momentInstance, The moment instance to set the locale on
   * @returns {boolean}
   */
  static setMomentLocale(locale: string): boolean {
    try {
      moment.updateLocale(locale, this.getMomentLocale(locale));
      return true;
    } catch (error) {
      console.error(error, ' setting moment locale : ', locale);
    }
    return false;
  }
  /**
   * Registers translations into the I18n manager.
   * @param translations The translations to register.
   * @returns The updated translations.
   */
  public registerTranslations(translations: I18nTranslation): I18nTranslation {
    this.store(translations);
    return this.getTranslations();
  }

  /**
   * Stores the provided translations and triggers a "translations-changed" event with the current locale and translations.
   * @param translations The translations to store.
   */
  store(translations: Dict): void {
    super.store(translations);
    this.trigger(
      'translations-changed',
      this.getLocale(),
      this.getTranslations()
    );
  }
  /**
   * Automatically resolves translations using reflect Metadata.
   * Translations created using the @Translate decorator will be resolved.
   * @param target The target class instance or object.
   * @example
   * // Class with translations using the decorator
   * class MyComponent {
   *     @Translate("greeting")
   *     public greeting: string;
   *
   *     @Translate("nested.example")
   *     public nestedExample: string;
   *
   *     @Translate("farewell")
   *     public sayGoodbye(): string {
   *         return "";
   *     }
   * }
   * // Resolve translations and print them
   * const component = new MyComponent();
   * I18n.getInstance().resolveTranslations(component);
   */
  public resolveTranslations<T extends object>(target: T): void {
    try {
      const keys = Object.getOwnPropertyNames(target);
      for (const key of keys) {
        const metadataKey = Reflect.getMetadata(TRANSLATION_KEY, target, key);
        if (metadataKey) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (target as any)[key] = this.translate(metadataKey);
          } catch (error) {
            Logger.error(
              error,
              ' resolving translation for key : ',
              metadataKey
            );
          }
        }
      }
    } catch (error) {
      Logger.error(error, ' resolving translations for target : ', target);
    }
  }

  /***
   * returns the missing placeholder string for the given placeholder and message.
   * @param placeholder - The placeholder to be replaced.
   * @param message - The message to be displayed.
   * @param options - The options for the missing placeholder string.
   * @returns The missing placeholder string.
   */
  getMissingPlaceholderString(
    placeholder: string,
    message?: string,
    options?: I18nTranslation
  ) {
    if (typeof this.missingPlaceholder == 'function') {
      return this.missingPlaceholder(
        this,
        placeholder,
        defaultStr(message),
        Object.assign({}, options)
      );
    }
    return placeholder;
  }
  /**
   * Gets the current locale for the i18n instance.
   * @returns {string} The current locale.
   */
  getLocale() {
    return super.locale;
  }

  /**
   * Sets the list of supported locales for the i18n instance.
   * @param locales - An array of locale strings to set as the supported locales.
   * @returns The list of all locales supported by the i18n instance, including both the locales for which translations are available and the locales explicitly set as supported.
   */
  public setLocales(locales: string[]) {
    this._locales = Array.isArray(locales) ? locales : ['en'];
    if (!this._locales.includes('en')) {
      this._locales.push('en');
    }
    return this.getLocales();
  }
  /***
   * returns true if the locale is supported by a i18n instance.
   * @param locale - The locale to check.
   * @returns true if the locale is supported, false otherwise.
   */
  public hasLocale(locale: string) {
    return isNonNullString(locale) && this.getLocales().includes(locale);
  }

  /**
   * Gets the list of all locales supported by the i18n instance, including both the locales for which translations are available and the locales explicitly set as supported.
   * @returns {string[]} The list of all supported locales.
   */
  getLocales(): string[] {
    const translations = Object.keys(this.getTranslations());
    const suportedLocales = Array.isArray(this._locales)
      ? this._locales
      : ['en'];
    const r = [
      ...translations,
      ...suportedLocales.filter((locale) => !translations.includes(locale)),
    ];
    if (!r.includes('en')) {
      r.push('en');
    }
    return r;
  }
  /***
   * returns true if the locale is supported by the i18n instance.
   * @param locale - The locale to check.
   * @returns true if the locale is supported, false otherwise.
   */
  isLocaleSupported(locale: string): boolean {
    if (!isNonNullString(locale)) return false;
    return this.getLocales().includes(locale);
  }
  /***
   * returns true if the instance is loading translations.
   * @returns true if the instance is loading translations, false otherwise.
   * @example
   * // Check if the instance is loading translations.
   * i18n.isLoading();
   */
  isLoading() {
    return this._isLoading;
  }

  private _namespacesLoaded: Dictionary = {};
  setLocale(locale: string, forceUpdate: boolean = false): Promise<string> {
    if (
      super.locale === locale &&
      forceUpdate !== true &&
      this._namespacesLoaded[locale]
    ) {
      return Promise.resolve(this.getLocale());
    }
    return new Promise((resolve, reject) => {
      this._isLoading = true;
      this.trigger('namespaces-before-load', locale);
      return this.loadNamespaces(locale)
        .then((translations) => {
          if (this.isDefaultInstance()) {
            I18n.instance = this;
            if (this.isLocaleSupported(locale)) {
              I18n.setLocaleToSession(locale);
            }
          }
          super.locale = locale;
          I18n.setMomentLocale(locale);
          this.trigger('locale-changed', locale, translations);
          resolve(locale);
        })
        .catch(reject)
        .finally(() => {
          this._isLoading = false;
        });
    });
  }
  /**
   * Register a namespace resolver.
   * @param namespace The namespace to register.
   * @param resolver The resolver function to load the namespace.
   * @example
   * // Register a namespace resolver for the "common" namespace.
   * i18n.registerNamespaceResolver("common", async (locale) => {
   *   const response = await fetch(`/i18n/${locale}/common.json`);
   *   return await response.json();
   * });
   */
  registerNamespaceResolver(
    namespace: string,
    resolver: (locale: string) => Promise<I18nTranslation>
  ): void {
    if (!isNonNullString(namespace) || typeof resolver !== 'function') {
      console.warn(
        'Invalid arguments for registerNamespaceResolver.',
        namespace,
        resolver
      );
      return;
    }
    this.namespaceResolvers[namespace] = resolver;
  }
  /**
   * Static method to register a namespace resolver to the I18n default instance.
   * @param namespace, The namespace to register.
   * @param resolver, The resolver function to load the namespace.
   * @returns
   * @example
   * // Register a namespace resolver for the "common" namespace.
   * I18n.RegisterNamespaceResolver("common", async (locale) => {
   *   const response = await fetch(`/i18n/${locale}/common.json`);
   *   return await response.json();
   * });
   */
  static RegisterNamespaceResolver(
    namespace: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: (locale: string) => Promise<any>
  ): void {
    return I18n.getInstance().registerNamespaceResolver(namespace, resolver);
  }

  loadNamespace(
    namespace: string,
    locale?: string,
    updateTranslations: boolean = true
  ): Promise<I18nTranslation> {
    if (!isNonNullString(namespace) || !this.namespaceResolvers[namespace]) {
      return Promise.reject(
        new Error(`Invalid namespace or resolver for namespace "${namespace}".`)
      );
    }
    locale = defaultStr(locale, this.getLocale());
    if (!isNonNullString(locale)) {
      return Promise.reject(
        new Error(`Locale is not set. Cannot load namespace "${namespace}".`)
      );
    }
    return this.namespaceResolvers[namespace](locale).then((translations) => {
      const dict: I18nTranslation = {};
      dict[locale as string] = Object.assign({}, translations);
      if (isObj(translations)) {
        if (updateTranslations !== false) {
          this.store(dict);
        }
        this.trigger('namespace-loaded', namespace, locale, dict);
      }
      return dict;
    });
  }

  static LoadNamespace(
    namespace: string,
    locale?: string,
    updateTranslations: boolean = true
  ): Promise<I18nTranslation> {
    return I18n.getInstance().loadNamespace(
      namespace,
      locale,
      updateTranslations
    );
  }

  loadNamespaces(
    locale?: string,
    updateTranslations: boolean = true
  ): Promise<I18nTranslation> {
    const namespaces = [];
    const translations: I18nTranslation = {};
    locale = defaultStr(locale, this.getLocale());
    this._isLoading = true;
    //const errors : any[] = [];
    for (const namespace in this.namespaceResolvers) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.namespaceResolvers,
          namespace
        ) &&
        typeof this.namespaceResolvers[namespace] === 'function'
      ) {
        namespaces.push(
          new Promise((resolve) => {
            this.namespaceResolvers[namespace](locale as string)
              .then((trs) => {
                extendObj(translations, trs);
              })
              .finally(() => {
                resolve(true);
              });
          })
        );
      }
    }
    return Promise.all(namespaces)
      .then(() => {
        const dict: I18nTranslation = {};
        dict[locale as string] = translations;
        if (updateTranslations !== false) {
          this.store(dict);
        }
        setTimeout(() => {
          this.trigger('namespaces-loaded', locale, dict);
        }, 100);
        return dict;
      })
      .finally(() => {
        this._isLoading = false;
      });
  }
  /***
   * Load all registered namespaces for the current locale on the I18n default instance.
   * @param locale optional locale to load the namespaces for
   * @param updateTranslations optional boolean to update the translations
   * @returns {Promise<I18nTranslation>} A promise that resolves to the combined translations for the current local
   */
  static LoadNamespaces(
    locale?: string,
    updateTranslations: boolean = true
  ): Promise<I18nTranslation> {
    return I18n.getInstance().loadNamespaces(locale, updateTranslations);
  }
  /**
   * Flattens a nested object into a single-level object with dot-notation keys.
   *
   * This utility method transforms complex nested objects into flat key-value pairs,
   * where nested properties are represented using dot notation (e.g., `user.name`).
   * This is particularly useful for interpolation processes that need to access
   * nested values using simple string keys.
   *
   * @param obj - The object to flatten. Can be any type.
   * @returns A flattened object where nested properties are accessible via dot-notation keys,
   *          or the original input if it's not an object.
   *
   * @example
   * ```typescript
   * // Basic flattening
   * const nested = {
   *   user: {
   *     name: 'John',
   *     profile: {
   *       age: 30,
   *       city: 'New York'
   *     }
   *   },
   *   settings: { theme: 'dark' }
   * };
   *
   * const flattened = I18n.flattenObject(nested);
   * // Result: {
   * //   'user.name': 'John',
   * //   'user.profile.age': 30,
   * //   'user.profile.city': 'New York',
   * //   'settings.theme': 'dark'
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Non-object inputs are returned as-is
   * I18n.flattenObject("string"); // Returns: "string"
   * I18n.flattenObject(42); // Returns: 42
   * I18n.flattenObject(null); // Returns: null
   * ```
   *
   * @example
   * ```typescript
   * // Usage in interpolation
   * const params = { user: { firstName: 'John', lastName: 'Doe' } };
   * const flattened = I18n.flattenObject(params);
   * // Now flattened can be used for interpolation like:
   * // "Hello %{user.firstName} %{user.lastName}" -> "Hello John Doe"
   * ```
   *
   * @note This method relies on `Object.flatten()` which should be available
   *       in the environment. If the input is not an object, it is returned unchanged.
   * @note Circular references in objects may cause issues during flattening.
   * @note Arrays are treated as objects and their indices become keys in the flattened result.
   *
   * @see {@link defaultInterpolator} for how this method is used in string interpolation.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flattenObject(obj: any): TranslateOptions {
    if (!isObj(obj)) return obj;
    return Object.flatten(obj);
  }

  /**
   * Provides a default interpolation function for the I18n instance.
   *
   * If the input `value` is `undefined` or `null`, an empty string is returned.
   * If the input `value` is not a number, boolean, or string, it is converted to a string using `stringify`.
   * If the input `params` is not an object, the `value` is returned as-is.
   * If the input `params` is an object, the `value` is replaced with any matching placeholders in the format `%{key}` using the corresponding values from the `params` object.
   *
   * @param i18n The I18n instance.
   * @param value The input value to be interpolated.
   * @param params Optional object containing replacement values for placeholders in the `value`.
   * @returns The interpolated string.
   */
  private static defaultInterpolator(
    i18n: I18nJs,
    value: string,
    params?: Dictionary
  ) {
    if (isNullable(value)) return '';
    if (!isPrimitive(value)) {
      return stringify(value, { escapeString: false });
    }
    value = String(value);
    if (!isObj(params)) return value;
    if (!params) return value;
    if (!isObj(params) || !params) return value;
    return value.replace(/%{(.*?)}/g, (_, key) => {
      return isNullable(params[key])
        ? ''
        : isPrimitive(params[key])
          ? String(params[key])
          : stringify(params[key], { escapeString: false });
    });
  }
}

const i18n = I18n.getInstance();

// Ensure the default exported instance passes `instanceof I18n` checks.
// When code is built and consumed across module boundaries, constructor
// identity can be inconsistent — to make the exported `i18n` recognized by
// `instanceof I18n` reliably in the same runtime, set its prototype to
// the class prototype. This preserves the current exported logic.
try {
  Object.setPrototypeOf(i18n, I18n.prototype);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
  // Setting the prototype may fail on frozen objects in some environments.
  // If it does, fallback to relying on Symbol.hasInstance which is already
  // implemented on the class for cross-realm compatibility.
}

export { i18n };
