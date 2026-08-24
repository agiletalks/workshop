import { useState, useEffect, useRef, useCallback } from "react";
import { appConfig } from "../data/app-config";
import { slides } from "../data/slides";
import type { SlideResponse, LearnerWorkbook } from "../data/slides";

const DEFAULT_WORKBOOK: LearnerWorkbook = {
  courseId: appConfig.courseId,
  version: appConfig.courseVersion,
  responses: {},
  activeSlideId: slides[0]?.id || "",
  viewMode: "focus",
  updatedAt: new Date().toISOString()
};

export type SaveStatus = "saved" | "saving" | "error";

export function useWorkbook() {
  const [workbook, setWorkbook] = useState<LearnerWorkbook>(() => {
    try {
      const stored = localStorage.getItem(appConfig.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as LearnerWorkbook;
        // Verify version compatibility
        if (parsed.courseId === appConfig.courseId) {
          // Fill in default active slide if missing
          if (!parsed.activeSlideId && slides.length > 0) {
            parsed.activeSlideId = slides[0].id;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load workbook from localStorage", e);
    }
    return { ...DEFAULT_WORKBOOK };
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSaved, setLastSaved] = useState<string>(() => new Date().toISOString());

  // Ref to hold the latest workbook state for debounced storage write
  const workbookRef = useRef<LearnerWorkbook>(workbook);
  useEffect(() => {
    workbookRef.current = workbook;
  }, [workbook]);

  // Debounced auto-save function
  useEffect(() => {
    // If the workbook has not changed from default initialization, we don't need to trigger a save immediately.
    // However, to ensure typing changes are captured, we set up a timer that triggers when workbook changes.
    const timer = setTimeout(() => {
      try {
        setSaveStatus("saving");
        localStorage.setItem(appConfig.storageKey, JSON.stringify(workbookRef.current));
        setSaveStatus("saved");
        setLastSaved(new Date().toISOString());
      } catch (e) {
        console.error("Failed to save workbook", e);
        setSaveStatus("error");
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [workbook]);

  // Mutator functions
  const getResponse = useCallback((slideId: string): SlideResponse => {
    return workbook.responses[slideId] || {
      slideId,
      personalNote: "",
      caseResponse: "",
      interactionData: null,
      updatedAt: new Date().toISOString(),
      completed: false
    };
  }, [workbook.responses]);

  const updateResponse = useCallback((slideId: string, updates: Partial<SlideResponse>) => {
    setWorkbook((prev: LearnerWorkbook) => {
      const current = prev.responses[slideId] || {
        slideId,
        personalNote: "",
        caseResponse: "",
        interactionData: null,
        updatedAt: new Date().toISOString(),
        completed: false
      };

      const updatedResponse = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      return {
        ...prev,
        responses: {
          ...prev.responses,
          [slideId]: updatedResponse
        },
        updatedAt: new Date().toISOString()
      };
    });
    setSaveStatus("saving");
  }, []);

  const updateNote = useCallback((slideId: string, note: string) => {
    updateResponse(slideId, { personalNote: note });
  }, [updateResponse]);

  const updateCaseResponse = useCallback((slideId: string, caseResponse: string) => {
    updateResponse(slideId, { caseResponse });
  }, [updateResponse]);

  const updateInteractionData = useCallback((slideId: string, data: any) => {
    updateResponse(slideId, { interactionData: data });
  }, [updateResponse]);

  const toggleCompleted = useCallback((slideId: string) => {
    const current = getResponse(slideId);
    updateResponse(slideId, { completed: !current.completed });
  }, [getResponse, updateResponse]);

  const setActiveSlideId = useCallback((slideId: string) => {
    setWorkbook((prev: LearnerWorkbook) => {
      if (prev.activeSlideId === slideId) return prev;
      return {
        ...prev,
        activeSlideId: slideId,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const setViewMode = useCallback((viewMode: "focus" | "overview") => {
    setWorkbook((prev: LearnerWorkbook) => {
      if (prev.viewMode === viewMode) return prev;
      return {
        ...prev,
        viewMode,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const resetWorkbook = useCallback(() => {
    const fresh = {
      ...DEFAULT_WORKBOOK,
      activeSlideId: slides[0]?.id || "",
      updatedAt: new Date().toISOString()
    };
    setWorkbook(fresh);
    localStorage.setItem(appConfig.storageKey, JSON.stringify(fresh));
    setSaveStatus("saved");
    setLastSaved(new Date().toISOString());
  }, []);

  const importWorkbook = useCallback((imported: LearnerWorkbook) => {
    setWorkbook(imported);
    localStorage.setItem(appConfig.storageKey, JSON.stringify(imported));
    setSaveStatus("saved");
    setLastSaved(new Date().toISOString());
  }, []);

  // Compute overall progress
  const getProgress = useCallback(() => {
    // Valid slides are those where showInProgress !== false (excluding cover, divider, conclusion, resource pages if configured)
    const validSlides = slides.filter(s => s.showInProgress !== false);
    const total = validSlides.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = validSlides.filter(s => workbook.responses[s.id]?.completed).length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }, [workbook.responses]);

  return {
    workbook,
    saveStatus,
    lastSaved,
    getResponse,
    updateNote,
    updateCaseResponse,
    updateInteractionData,
    toggleCompleted,
    setActiveSlideId,
    setViewMode,
    resetWorkbook,
    importWorkbook,
    getProgress
  };
}
