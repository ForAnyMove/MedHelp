import { useComponentContext } from '../context/GlobalContext';

/**
 * useTheme Hook
 * Shortcut to the themeController within our Global ComponentContext.
 * Maintains compatibility with existing components using useTheme().
 */
export const useTheme = () => {
  const { themeController } = useComponentContext();
  return themeController;
};
