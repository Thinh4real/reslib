import { ObservableCallback } from '../../observable';
import { I18nTranslation } from '../../types/i18n';
import '../../utils';
import { I18n, Translate, i18n as defaultI18n } from '../index';

describe('I18n', () => {
  let i18n: I18n;

  beforeEach(() => {
    i18n = I18n.getInstance();
    i18n.registerTranslations({
      en: {
        resources: {},
        validator: {
          length: 'This field must be exactly %{length} characters long',
          lengthRange:
            'This field must be between %{minLength} and %{maxLength} characters long',
          numberLTE:
            'This field must be less than or equal to %{ruleParams[0]}',
          numberLT: 'This field must be less than %{ruleParams[0]}',
          numberGTE:
            'This field must be greater than or equal to %{ruleParams[0]}',
          numberGT: 'This field must be greater than %{ruleParams[0]}',
          noteEquals: 'This field must be different from %{ruleParams[0]}',
          numberIsDifferentFrom:
            'This field must be different from %{ruleParams[0]}',
          numberEquals: 'This field must be equal to %{ruleParams[0]}',
        },
      },
    });
  });
  test('sould return correct translation from validator length rules', () => {
    expect(i18n.t('validator.length', { length: 10 })).toBe(
      'This field must be exactly 10 characters long'
    );
    expect(
      i18n.t('validator.lengthRange', { minLength: 5, maxLength: 10 })
    ).toBe('This field must be between 5 and 10 characters long');
    expect(i18n.t('validator.numberLTE', { ruleParams: [10] })).toBe(
      'This field must be less than or equal to 10'
    );
    expect(i18n.t('validator.numberLT', { ruleParams: [10] })).toBe(
      'This field must be less than 10'
    );
    expect(i18n.t('validator.numberGTE', { ruleParams: [10] })).toBe(
      'This field must be greater than or equal to 10'
    );
    expect(i18n.t('validator.numberGT', { ruleParams: [10] })).toBe(
      'This field must be greater than 10'
    );
    expect(i18n.t('validator.noteEquals', { ruleParams: ['test'] })).toBe(
      'This field must be different from test'
    );
    expect(
      i18n.t('validator.numberIsDifferentFrom', { ruleParams: [10] })
    ).toBe('This field must be different from 10');
    expect(i18n.t('validator.numberEquals', { ruleParams: [10] })).toBe(
      'This field must be equal to 10'
    );
  });

  test('exported default instance must be recognized as I18n (instanceof)', () => {
    // assure cross-boundary instanceof by checking the canonical Symbol.hasInstance
    // The instance returned by the factory should be recognized
    const created = I18n.createInstance({}, { locale: 'en' });
    expect(created instanceof I18n).toBe(true);

    const instance = I18n.getInstance();
    // the default singleton should at least have the core methods
    expect(typeof instance?.getLocale).toBe('function');
    expect(typeof instance?.translate).toBe('function');
    expect(typeof instance?.translateTarget).toBe('function');

    // verify the default exported instance is recognized as I18n
    expect(defaultI18n instanceof I18n).toBe(true);
    // and its prototype is the I18n prototype
    expect(Object.getPrototypeOf(defaultI18n)).toBe(I18n.prototype);
    // also should be true for I18n.getInstance()
    // Should recognize duck-typed objects as well
    const fakeI18n = {
      getLocale: () => 'en',
      translate: () => 'x',
      translateTarget: () => ({}),
    } as any;
    expect((I18n as any)[Symbol.hasInstance](fakeI18n)).toBe(true);
    // and for new instances
    const newInst = new I18n();
    expect(newInst instanceof I18n).toBe(true);

    // object with duck-typed I18n methods should be recognized as well
    expect(fakeI18n instanceof I18n).toBe(true);

    // object missing required methods should not be considered an I18n
    const incomplete = { translate: () => 'x' } as any;
    expect(incomplete instanceof I18n).toBe(false);
  });

  test('should register and retrieve translations', () => {
    const translations: I18nTranslation = {
      en: {
        greeting: 'Hello, %{name}!',
        farewell: 'Goodbye!',
      },
    };
    i18n.registerTranslations(translations);
    expect(i18n.t('greeting', { name: 'John' })).toBe('Hello, John!');
    expect(i18n.t('farewell')).toBe('Goodbye!');
  });

  test('should trigger and handle events', () => {
    const callback: ObservableCallback = jest.fn();
    i18n.on('translations-changed', callback);
    const translations: I18nTranslation = {
      en: {
        greeting: 'Hello, %{name}!',
      },
    };
    i18n.registerTranslations(translations);
    expect(callback).toHaveBeenCalledWith('en', i18n.getTranslations());
  });

  test('should load namespace and update translations', async () => {
    const namespaceResolver = jest.fn().mockResolvedValue({
      greeting: 'Hello, %{name}!',
    });
    i18n.registerNamespaceResolver('common', namespaceResolver);
    const translations = await i18n.loadNamespace('common', 'en');
    expect(translations).toEqual({ en: { greeting: 'Hello, %{name}!' } });
    expect(i18n.t('greeting', { name: 'John' })).toBe('Hello, John!');
  });

  test('should handle invalid namespace', async () => {
    await expect(i18n.loadNamespace('invalid')).rejects.toThrow(
      'Invalid namespace or resolver for namespace "invalid".'
    );
  });

  class MyComponent {
    @Translate('greeting')
    greeting: string = '';

    @Translate('nested.example')
    public nestedExample: string = '';
  }

  const translations: I18nTranslation = {
    en: {
      greeting: 'Hello!',
      nested: {
        example: 'Nested Example',
      },
      farewell: 'Goodbye!',
    },
  };
  test('should resolve translations using decorator', () => {
    i18n.registerTranslations(translations);
    const component = new MyComponent();
    i18n.resolveTranslations(component);
    expect(component.greeting).toBe('Hello!');
    expect(component.nestedExample).toBe('Nested Example');
  });

  it('Expect translated options of my component', () => {
    const translatedOptions = i18n.translateTarget(MyComponent);
    expect(translatedOptions).toEqual({
      greeting: 'Hello!',
      nestedExample: 'Nested Example',
    });
  });

  test('should set and get locale', async () => {
    await i18n.setLocale('fr');
    expect(i18n.getLocale()).toBe('fr');
  });

  test('should support multiple locales', () => {
    i18n.setLocales(['en', 'fr']);
    expect(i18n.getLocales()).toEqual(['en', 'fr']);
  });

  test('should check if locale is supported', () => {
    i18n.setLocales(['en', 'fr']);
    expect(i18n.isLocaleSupported('en')).toBe(true);
    expect(i18n.isLocaleSupported('de')).toBe(false);
  });

  test('should load all namespaces', async () => {
    const namespaceResolver = jest.fn().mockResolvedValue({
      greeting: 'Hello, %{name}!',
    });
    i18n.registerNamespaceResolver('common', namespaceResolver);
    const translations = await i18n.loadNamespaces('en');
    expect(translations).toEqual({ en: { greeting: 'Hello, %{name}!' } });
  });

  test('should support pluralization and pluralization checks', () => {
    const instance = I18n.createInstance(
      {
        en: {
          apples: {
            one: 'apple',
            other: '%{count} apples',
          },
          cars: {
            one: 'car',
            other: '%{count} cars',
          },
        },
      },
      { locale: 'en' }
    );

    expect(instance.isPluralizeOptions({ count: 1 })).toBe(true);
    expect(instance.canPluralize('apples')).toBe(true);
    expect(instance.translate('apples', { count: 1 })).toBe('apple');
    expect(instance.translate('apples', { count: 5 })).toBe('5 apples');
    expect(instance.translate('cars', { count: 2 })).toBe('2 cars');
  });

  test('should properly load namespace resolvers, update translations and trigger events', async () => {
    const nsResolver = jest.fn(async (locale: string) => ({
      greeting: `hello-${locale}`,
    }));

    // register resolver and ensure namespace loaded updates translations
    // use a new instance to avoid global interference with tests
    const instance = I18n.createInstance({}, { locale: 'en' });
    instance.registerNamespaceResolver('test-ns', nsResolver);
    const loaded = await instance.loadNamespace('test-ns', 'en');
    expect(loaded).toEqual({ en: { greeting: 'hello-en' } });
    expect(instance.t('greeting')).toBe('hello-en');
  });

  test('getNestedTranslation should resolve deep paths and arrays', () => {
    const inst = I18n.createInstance(
      {
        en: {
          nested: {
            deep: {
              value: 'X',
            },
          },
        },
      },
      { locale: 'en' }
    );

    expect(inst.getNestedTranslation('nested.deep.value')).toBe('X');
    expect(inst.getNestedTranslation(['nested', 'deep', 'value'])).toBe('X');
  });

  test('createInstance should allow custom interpolator function', () => {
    const inst = I18n.createInstance(
      { en: { greeting: 'Hello %{name}' } },
      {
        locale: 'en',
        interpolate: (_i18n, str, params) =>
          `CUSTOM-${String(params?.name ?? '')}`,
      }
    );

    expect(inst.translate('greeting', { name: 'John' })).toBe('CUSTOM-John');
  });

  test('moment locale registration and update should work', () => {
    const momentLocale: any = { months: ['jan', 'feb', 'mar'] };
    I18n.registerMomentLocale('xx', momentLocale);
    expect(I18n.getMomentLocale('xx')).toEqual(
      expect.objectContaining({ months: expect.any(Array) })
    );
    // Should not throw when setting an available moment locale
    expect(I18n.setMomentLocale('xx')).toBe(true);
  });
});

describe('i18n translateObject', () => {
  const i18n = I18n.getInstance();
  beforeAll(async () => {
    i18n.registerTranslations({
      en: {
        user: {
          name: 'Name',
          email: 'Email Address',
          phone: 'Phone Number',
        },
        actions: {
          save: 'Save',
          cancel: 'Cancel',
        },
        nested: {
          deep: {
            value: 'Deep nested value',
          },
        },
        validation: {
          required: 'This field is required',
          email: {
            invalid: 'Please enter a valid email',
          },
          minLength: 'Minimum length required',
          maxLength: 'Maximum length exceeded',
        },
      },
      fr: {
        user: {
          name: 'Nom',
          email: 'Adresse Email',
          phone: 'Numéro de Téléphone',
        },
        action: {
          'actions.save': 'Enregistrer',
          'actions.cancel': 'Annuler',
        },
        validation: {
          required: 'Ce champ est requis',
          email: {
            invalid: 'Veuillez saisir un email valide',
          },
          minLength: 'Longueur minimale requise',
          maxLength: 'Longueur maximale dépassée',
        },
      },
    });
    i18n.setLocales(['env', 'fr']);
    await i18n.setLocale('en');
  });

  it('should translate an object with translation keys as values', () => {
    const formLabels = {
      name: 'user.name',
      email: 'user.email',
      phone: 'user.phone',
    };
    const result = i18n.translateObject(formLabels);
    expect(result).toEqual({
      name: 'Name',
      email: 'Email Address',
      phone: 'Phone Number',
    });
  });

  it('should translate button configuration object', () => {
    const buttonConfig = {
      saveButton: 'actions.save',
      cancelButton: 'actions.cancel',
    };

    const result = i18n.translateObject(buttonConfig);

    expect(result).toEqual({
      saveButton: 'Save',
      cancelButton: 'Cancel',
    });
  });

  it('should translate validation messages object', () => {
    const validationMessages = {
      required: 'validation.required',
      email: 'validation.email.invalid',
      minLength: 'validation.minLength',
      maxLength: 'validation.maxLength',
    };

    const result = i18n.translateObject(validationMessages);

    expect(result).toEqual({
      required: 'This field is required',
      email: 'Please enter a valid email',
      minLength: 'Minimum length required',
      maxLength: 'Maximum length exceeded',
    });
  });

  it('should work with different locales', async () => {
    await i18n.setLocale('fr');
    const formLabels = {
      name: 'user.name',
      email: 'user.email',
    };

    const result = i18n.translateObject(formLabels);

    expect(result).toEqual({
      name: 'Nom',
      email: 'Adresse Email',
    });

    await i18n.setLocale('en');
  });

  it('should return empty object when input is not a valid object', () => {
    expect(i18n.translateObject(null as any)).toEqual({});
    expect(i18n.translateObject(undefined as any)).toEqual({});
    expect(i18n.translateObject('string' as any)).toEqual({});
    expect(i18n.translateObject(123 as any)).toEqual({});
    expect(i18n.translateObject([] as any)).toEqual({});
  });

  it('should skip non-string values', () => {
    const mixedObject = {
      validKey: 'user.name',
      nullValue: null,
      undefinedValue: undefined,
      numberValue: 123,
      emptyString: '',
    };

    const result = i18n.translateObject(mixedObject as any);

    expect(result).toEqual({
      validKey: 'Name',
    });
  });

  it('should handle missing translation keys gracefully', async () => {
    const objectWithMissingKeys = {
      existing: 'user.name',
      missing: 'non.existent.key',
    };
    await i18n.setLocale('en');
    const result = i18n.translateObject(objectWithMissingKeys);

    expect(result.existing).toBe('Name');
    expect(result.missing).toBeDefined();
  });

  it('should pass through translate options', () => {
    i18n.registerTranslations({
      en: {
        greeting: 'Hello, %{name}!',
      },
    });

    const objectWithParams = {
      greeting: 'greeting',
    };

    const result = i18n.translateObject(objectWithParams, { name: 'John' });

    expect(result).toEqual({
      greeting: 'Hello, John!',
    });
  });

  it('should handle nested translation keys', () => {
    const nestedObject = {
      deepValue: 'nested.deep.value',
    };

    const result = i18n.translateObject(nestedObject);

    expect(result).toEqual({
      deepValue: 'Deep nested value',
    });
  });

  it('should preserve object structure with complex keys', () => {
    const complexObject = {
      'user-name': 'user.name',
      user_email: 'user.email',
      '123key': 'user.phone',
    };

    const result = i18n.translateObject(complexObject);

    expect(result).toEqual({
      'user-name': 'Name',
      user_email: 'Email Address',
      '123key': 'Phone Number',
    });
  });

  it('should handle empty object', () => {
    const result = i18n.translateObject({});
    expect(result).toEqual({});
  });
});
