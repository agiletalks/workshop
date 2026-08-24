import { useState, useEffect, useRef, useCallback } from "react";
import { appConfig } from "../data/app-config";
import { slides } from "../data/slides";
import type { SlideResponse, LearnerWorkbook } from "../data/slides";
import { db, isFirebaseConfigured } from "../services/firebase";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";

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
  const [teamId, setTeamIdState] = useState(() => localStorage.getItem("split_teamId") || "Team 1");
  const [workbook, setWorkbook] = useState<LearnerWorkbook>(() => {
    try {
      const stored = localStorage.getItem(appConfig.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as LearnerWorkbook;
        if (parsed.courseId === appConfig.courseId) {
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
  const [pendingWrites, setPendingWrites] = useState<Record<string, SlideResponse>>({});

  const workbookRef = useRef<LearnerWorkbook>(workbook);
  useEffect(() => {
    workbookRef.current = workbook;
  }, [workbook]);

  // Listen to changes in split_teamId in localStorage (e.g. from user login or teacher switching teams)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentTeam = localStorage.getItem("split_teamId") || "Team 1";
      if (currentTeam !== teamId) {
        setTeamIdState(currentTeam);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [teamId]);

  // Subscribe to Firestore for group responses in real-time
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const colRef = collection(db, "workshops", "split", "teams", teamId, "responses");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        setWorkbook((prev) => {
          const newResponses = { ...prev.responses };
          let hasChanges = false;

          snapshot.forEach((doc) => {
            const slideId = doc.id;
            const remoteVal = doc.data() as SlideResponse;
            const localVal = prev.responses[slideId];

            // Update if no local value or remote is newer
            if (!localVal || new Date(remoteVal.updatedAt) > new Date(localVal.updatedAt)) {
              newResponses[slideId] = remoteVal;
              hasChanges = true;
            }
          });

          if (hasChanges) {
            const updated = {
              ...prev,
              responses: newResponses,
              updatedAt: new Date().toISOString()
            };
            // Cache to localstorage as fallback
            localStorage.setItem(appConfig.storageKey, JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      },
      (error) => {
        console.error("Firestore workbook subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [teamId]);

  // Debounced auto-save effect for Firestore/localStorage
  useEffect(() => {
    if (Object.keys(pendingWrites).length === 0) return;

    const timer = setTimeout(async () => {
      const writes = { ...pendingWrites };
      setPendingWrites({});

      if (isFirebaseConfigured && db) {
        try {
          for (const [slideId, response] of Object.entries(writes)) {
            const docRef = doc(db, "workshops", "split", "teams", teamId, "responses", slideId);
            await setDoc(docRef, response);
          }
          setSaveStatus("saved");
          setLastSaved(new Date().toISOString());
        } catch (e) {
          console.error("Failed to save to Firestore", e);
          setSaveStatus("error");
          // Re-queue writes
          setPendingWrites((prevPending) => ({
            ...writes,
            ...prevPending
          }));
        }
      } else {
        // LocalStorage Fallback
        try {
          localStorage.setItem(appConfig.storageKey, JSON.stringify(workbookRef.current));
          setSaveStatus("saved");
          setLastSaved(new Date().toISOString());
        } catch (e) {
          console.error("Failed to save workbook locally", e);
          setSaveStatus("error");
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [pendingWrites, teamId]);

  // Mutator functions
  const getResponse = useCallback(
    (slideId: string): SlideResponse => {
      return (
        workbook.responses[slideId] || {
          slideId,
          personalNote: "",
          caseResponse: "",
          interactionData: null,
          updatedAt: new Date().toISOString(),
          completed: false
        }
      );
    },
    [workbook.responses]
  );

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

      setPendingWrites((prevPending) => ({
        ...prevPending,
        [slideId]: updatedResponse
      }));

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

  const updateNote = useCallback(
    (slideId: string, note: string) => {
      updateResponse(slideId, { personalNote: note });
    },
    [updateResponse]
  );

  const updateCaseResponse = useCallback(
    (slideId: string, caseResponse: string) => {
      updateResponse(slideId, { caseResponse });
    },
    [updateResponse]
  );

  const updateInteractionData = useCallback(
    (slideId: string, data: any) => {
      updateResponse(slideId, { interactionData: data });
    },
    [updateResponse]
  );

  const toggleCompleted = useCallback(
    (slideId: string) => {
      const current = getResponse(slideId);
      updateResponse(slideId, { completed: !current.completed });
    },
    [getResponse, updateResponse]
  );

  const setActiveSlideId = useCallback((slideId: string) => {
    setWorkbook((prev: LearnerWorkbook) => {
      if (prev.activeSlideId === slideId) return prev;
      const updated = {
        ...prev,
        activeSlideId: slideId,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(appConfig.storageKey, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setViewMode = useCallback((viewMode: "focus" | "overview") => {
    setWorkbook((prev: LearnerWorkbook) => {
      if (prev.viewMode === viewMode) return prev;
      const updated = {
        ...prev,
        viewMode,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(appConfig.storageKey, JSON.stringify(updated));
      return updated;
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

    // Clear Firestore collection responses for this team if configured
    if (isFirebaseConfigured && db) {
      // (Optional: can leave Firestore intact or delete individual docs)
    }
  }, []);

  const importWorkbook = useCallback((imported: LearnerWorkbook) => {
    setWorkbook(imported);
    localStorage.setItem(appConfig.storageKey, JSON.stringify(imported));
    setSaveStatus("saved");
    setLastSaved(new Date().toISOString());
  }, []);

  const getProgress = useCallback(() => {
    const validSlides = slides.filter((s) => s.showInProgress !== false);
    const total = validSlides.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = validSlides.filter((s) => workbook.responses[s.id]?.completed).length;
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
