import { useState, useEffect } from 'react';
import { createApiClient } from '../api/apiClient';
import { useTranslation } from 'react-i18next';

export const useLegalManager = (setAppLoading, session, refreshSessionToken) => {
  const { i18n } = useTranslation();
  const apiClient = createApiClient(session, refreshSessionToken);
  const [content, setContent] = useState({
    faq: [],
    privacy_policy: [],
    terms_of_use: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchLegalContent = async () => {
    if (hasFetched) return; // Prevent multiple fetches
    setLoading(true);
    try {
      const response = await apiClient.get('/legal/content');
      if (response) {
        setContent(response);
        setHasFetched(true);
      }
    } catch (err) {
      console.error('[useLegalManager] Failed to fetch legal content:', err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegalContent();
  }, []);

  // Helper function to get localized content
  const getLocalizedList = (list) => {
    const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';
    
    return list.map(item => {
      // For FAQ
      if (item.question_en) {
        return {
          id: item.id,
          question: lang === 'ru' ? item.question_ru : item.question_en,
          answer: lang === 'ru' ? item.answer_ru : item.answer_en,
        };
      }
      // For Legal (Privacy/Terms)
      return {
        id: item.id,
        icon: item.icon,
        title: lang === 'ru' ? item.title_ru : item.title_en,
        content: lang === 'ru' ? item.content_ru : item.content_en,
      };
    });
  };

  return {
    content: {
      faq: getLocalizedList(content.faq),
      privacy_policy: getLocalizedList(content.privacy_policy),
      terms_of_use: getLocalizedList(content.terms_of_use),
    },
    loading,
    error,
    refresh: fetchLegalContent
  };
};
