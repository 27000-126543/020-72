export const ANSWERS_KEY = 'mta_user_answers';
export const STATS_KEY = 'mta_user_stats';
export const MISTAKES_KEY = 'mta_mistakes';
export const LAST_QUESTION_KEY = 'mta_last_question';

export const SafeLocalStorage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
    }
  },
};
