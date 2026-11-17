import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView } from 'react-native';

type Section = 'home' | 'history' | 'profile';

type ChromeValue = {
  section: Section;
  setSection: (section: Section) => void;
  register: (key: string, toTop: () => void) => () => void;
  scrollToTop: (key: string) => void;
};

const ChromeContext = createContext<ChromeValue | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState<Section>('home');
  const scrollers = useRef(new Map<string, () => void>());

  const register = useCallback((key: string, toTop: () => void) => {
    scrollers.current.set(key, toTop);
    return () => {
      if (scrollers.current.get(key) === toTop) scrollers.current.delete(key);
    };
  }, []);

  const scrollToTop = useCallback((key: string) => {
    scrollers.current.get(key)?.();
  }, []);

  const value = useMemo(
    () => ({ section, setSection, register, scrollToTop }),
    [section, register, scrollToTop],
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome() {
  const value = useContext(ChromeContext);
  if (!value) throw new Error('Chrome missing');
  return value;
}

export function useRegisterScroll(key: string, toTop: () => void) {
  const { register } = useChrome();
  const stable = useRef(toTop);
  stable.current = toTop;
  useEffect(() => register(key, () => stable.current()), [key, register]);
}

export function useSection(section: Section) {
  const { setSection } = useChrome();
  useEffect(() => {
    setSection(section);
  }, [section, setSection]);
}

export function useScrollRef(key: string) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const toTop = useCallback(() => {
    ref.current?.scrollTo({ y: 0, animated: true });
  }, []);
  useRegisterScroll(key, toTop);
  return ref;
}
