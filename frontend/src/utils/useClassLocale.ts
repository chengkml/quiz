import React, { useState, useEffect } from 'react';

interface LocaleConfig {
  [key: string]: string;
}

const useClassLocale = (localeData?: LocaleConfig) => {
  const [locale, setLocale] = useState<LocaleConfig>(localeData || {});

  useEffect(() => {
    if (localeData) {
      setLocale(localeData);
    }
  }, [localeData]);

  const t = (key: string, defaultValue?: string): string => {
    return locale[key] || defaultValue || key;
  };

  return {
    locale,
    t
  };
};

export default useClassLocale;