import { useEffect, useRef, useState } from 'react';

import {
  API_BASE_URL,
  DISPLAY_BRIGHTNESS_STORAGE_KEY,
  HISTORY_REFERENCE_STORAGE_KEY,
} from '../../config/appConfig';

function useWorkspaceFeature() {
  const [activeTab, setActiveTab] = useState('home');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingElapsedSeconds, setLoadingElapsedSeconds] = useState(0);
  const [suggestingPrompt, setSuggestingPrompt] = useState(false);
  const [promptSuggestion, setPromptSuggestion] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [appNotice, setAppNotice] = useState('');
  const [brightness, setBrightness] = useState(() => {
    if (typeof window === 'undefined') return 100;

    const savedBrightness = Number(window.localStorage.getItem(DISPLAY_BRIGHTNESS_STORAGE_KEY));
    return Number.isFinite(savedBrightness) && savedBrightness >= 70 && savedBrightness <= 300
      ? savedBrightness
      : 100;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [referencePreview, setReferencePreview] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const fileInputRef = useRef(null);

  const decreaseBrightness = () => setBrightness((current) => Math.max(70, current - 10));
  const increaseBrightness = () => setBrightness((current) => Math.min(300, current + 10));
  const resetBrightness = () => setBrightness(100);
  const displayFilterStyle = { filter: `brightness(${brightness}%)` };

  const handleDownload = async (imageUrl) => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI-Vision-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setAppNotice('Unable to download the image. Please try again.');
    }
  };

  const getStoredReferenceImage = (imageUrl) => {
    if (!imageUrl) return null;

    try {
      const stored = localStorage.getItem(HISTORY_REFERENCE_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed[imageUrl] || null;
    } catch (error) {
      console.error('Failed to read cached reference image:', error);
      return null;
    }
  };

  const cacheReferenceImage = (imageUrl, previewUrl) => {
    if (!imageUrl || !previewUrl) return;

    try {
      const stored = localStorage.getItem(HISTORY_REFERENCE_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[imageUrl] = previewUrl;
      localStorage.setItem(HISTORY_REFERENCE_STORAGE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to cache reference image:', error);
    }
  };

  const fetchHistory = async (email) => {
    if (!email) return;
    try {
      console.log('ðŸ” Fetching history for:', email);
      const res = await fetch(`${API_BASE_URL}/get-history?email=${email}`);
      const data = await res.json();

      if (data.status === 'success') {
        if (data.data && data.data.length > 0) {
          setHistoryItems(data.data);
        } else {
          console.log('Database is empty for this user.');
          setHistoryItems([]);
        }
      }
    } catch {
      console.error(' Link Backend error or not running main.py');
    }
  };

  const fetchPromptSuggestion = async (file) => {
    if (!file) return;

    setSuggestingPrompt(true);
    setPromptSuggestion('');
    setImageCaption('');
    setAppNotice('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/suggest-prompt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setPromptSuggestion(data.suggested_prompt || '');
        setImageCaption(data.caption || '');
        return;
      }

      setAppNotice(data.message || data.detail || 'Unable to suggest a prompt for this image.');
    } catch (error) {
      console.error(error);
      setAppNotice('Unable to suggest a prompt for this image.');
    } finally {
      setSuggestingPrompt(false);
    }
  };

  const handleReferenceFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
    fetchPromptSuggestion(file);
  };

  const startNewProject = () => {
    setResult(null);
    setPrompt('');
    setPromptSuggestion('');
    setImageCaption('');
    setReferencePreview(null);
    setReferenceFile(null);
    setSelectedHistoryItem(null);
    setActiveTab('home');
  };

  const loadHistoryItem = (item, options = {}) => {
    if (!item) return;

    const restoredReferenceImage = item.reference_image_url || getStoredReferenceImage(item.image_url);

    setSelectedHistoryItem(item);
    if (item.image_url) setResult(item.image_url);
    setPrompt(item.prompt || '');
    setPromptSuggestion('');
    setImageCaption('');
    setReferencePreview(restoredReferenceImage);
    setReferenceFile(null);

    if (options.openEditor) {
      setActiveTab('home');
    }
  };

  const generateImage = async (currentUserEmail) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setLoadingElapsedSeconds(0);
    setAppNotice('');
    try {
      const formData = new FormData();
      formData.append('text', prompt.trim());
      formData.append('email', currentUserEmail);
      if (referenceFile) formData.append('image', referenceFile);

      const res = await fetch(`${API_BASE_URL}/edit-image`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.status === 'success') {
        setResult(data.image_url);
        setSelectedHistoryItem(null);
        cacheReferenceImage(data.image_url, referencePreview);
        fetchHistory(currentUserEmail);
      } else {
        setAppNotice(`AI error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      setAppNotice('Image generation system error.');
    } finally {
      setLoading(false);
    }
  };

  const openHistoryTab = (currentUserEmail) => {
    setActiveTab('history');
    fetchHistory(currentUserEmail);
  };

  useEffect(() => {
    setAppNotice('');
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(DISPLAY_BRIGHTNESS_STORAGE_KEY, String(brightness));
  }, [brightness]);

  useEffect(() => {
    if (!loading) {
      setLoadingElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setLoadingElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

  return {
    activeTab,
    appNotice,
    brightness,
    decreaseBrightness,
    displayFilterStyle,
    fetchHistory,
    fileInputRef,
    generateImage,
    handleDownload,
    handleReferenceFileChange,
    historyItems,
    imageCaption,
    increaseBrightness,
    isSettingsOpen,
    loadHistoryItem,
    loading,
    loadingElapsedSeconds,
    openHistoryTab,
    prompt,
    promptSuggestion,
    referencePreview,
    resetBrightness,
    result,
    selectedHistoryItem,
    setActiveTab,
    setAppNotice,
    setBrightness,
    setIsSettingsOpen,
    setPrompt,
    startNewProject,
    suggestingPrompt,
  };
}

export default useWorkspaceFeature;
