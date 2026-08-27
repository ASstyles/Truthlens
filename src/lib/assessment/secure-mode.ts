"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { IntegrityEvent, IntegrityEventType, IntegritySummary } from "../types";

export interface SecureAssessmentOptions {
  isActive: boolean;
  assessmentId: string | null;
  turnNumber?: number;
  onIntegrityWarning?: (event: IntegrityEvent) => void;
  onMultiTabCollision?: () => void;
}

export function useSecureAssessment({
  isActive,
  assessmentId,
  turnNumber = 1,
  onIntegrityWarning,
  onMultiTabCollision,
}: SecureAssessmentOptions) {
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([]);
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [isMultiTabLocked, setIsMultiTabLocked] = useState<boolean>(false);
  const [lastWarning, setLastWarning] = useState<IntegrityEvent | null>(null);

  // Tab instance ID
  const tabInstanceIdRef = useRef<string>(
    typeof window !== "undefined"
      ? `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      : "tab-server"
  );

  const turnRef = useRef(turnNumber);
  turnRef.current = turnNumber;

  const calculateScore = useCallback((events: IntegrityEvent[]) => {
    let penalty = 0;
    events.forEach((ev) => {
      if (ev.severity === "HIGH") penalty += 15;
      else if (ev.severity === "MEDIUM") penalty += 8;
      else penalty += 4;
    });
    return Math.max(20, 100 - penalty);
  }, []);

  const recordIntegrityEvent = useCallback(
    (
      type: IntegrityEventType,
      details: string,
      severity: "LOW" | "MEDIUM" | "HIGH" = "LOW"
    ) => {
      if (!isActive) return;

      const newEvent: IntegrityEvent = {
        id: `int-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        type,
        timestamp: new Date().toISOString(),
        details,
        turnNumber: turnRef.current,
        severity,
      };

      setIntegrityEvents((prev) => {
        // Prevent duplicate spam within 1 second
        const last = prev[prev.length - 1];
        if (
          last &&
          last.type === type &&
          Date.now() - new Date(last.timestamp).getTime() < 1200
        ) {
          return prev;
        }
        const updated = [...prev, newEvent];
        setIntegrityScore(calculateScore(updated));
        return updated;
      });

      setLastWarning(newEvent);
      onIntegrityWarning?.(newEvent);
    },
    [isActive, calculateScore, onIntegrityWarning]
  );

  // 1. Multi-Tab Session Guard via BroadcastChannel & LocalStorage
  useEffect(() => {
    if (!isActive || !assessmentId || typeof window === "undefined") return;

    const channelName = `truthlens_assessment_${assessmentId}`;
    let bc: BroadcastChannel | null = null;

    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel(channelName);

        bc.onmessage = (e) => {
          if (e.data && e.data.tabId && e.data.tabId !== tabInstanceIdRef.current) {
            if (e.data.type === "PING_EXISTING") {
              // Respond that this tab is already the active assessment host
              bc?.postMessage({
                type: "HOST_ACTIVE",
                tabId: tabInstanceIdRef.current,
                timestamp: Date.now(),
              });
            } else if (e.data.type === "HOST_ACTIVE") {
              // Another tab is already running this session
              setIsMultiTabLocked(true);
              recordIntegrityEvent(
                "MULTI_TAB_COLLISION",
                "Assessment opened in another tab simultaneously",
                "HIGH"
              );
              onMultiTabCollision?.();
            }
          }
        };

        // Announce presence to check if another tab is active
        bc.postMessage({
          type: "PING_EXISTING",
          tabId: tabInstanceIdRef.current,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.warn("[TruthLens Security] BroadcastChannel setup warning:", err);
    }

    return () => {
      bc?.close();
    };
  }, [isActive, assessmentId, recordIntegrityEvent, onMultiTabCollision]);

  // 2. Keyboard & Shortcut Restrictions (Active Only During Assessment)
  useEffect(() => {
    if (!isActive || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // 1. Block F12 (Developer Tools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("DEVTOOLS_SHORTCUT", "F12 Developer Tools key intercepted", "HIGH");
        return false;
      }

      // 2. Block Ctrl+Shift+I / J / C (Devtools Inspector/Console)
      if (isCtrlOrMeta && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("DEVTOOLS_SHORTCUT", "DevTools inspector shortcut intercepted", "HIGH");
        return false;
      }

      // 3. Block Ctrl+C (Copy) & Ctrl+X (Cut)
      if (isCtrlOrMeta && (key === "c" || key === "x")) {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("COPY_ATTEMPT", "Clipboard copy/cut shortcut intercepted", "LOW");
        return false;
      }

      // 4. Block Ctrl+V (Paste)
      if (isCtrlOrMeta && key === "v") {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("PASTE_ATTEMPT", "External answer paste shortcut intercepted", "MEDIUM");
        return false;
      }

      // 5. Block Ctrl+U (View Page Source)
      if (isCtrlOrMeta && key === "u") {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("DEVTOOLS_SHORTCUT", "View page source shortcut intercepted", "MEDIUM");
        return false;
      }

      // 6. Block Ctrl+F (Find in Page)
      if (isCtrlOrMeta && key === "f") {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("DEVTOOLS_SHORTCUT", "Find in page shortcut intercepted", "LOW");
        return false;
      }

      // 7. Block Ctrl+P (Print Page)
      if (isCtrlOrMeta && key === "p") {
        e.preventDefault();
        e.stopPropagation();
        recordIntegrityEvent("PRINT_ATTEMPT", "Print page shortcut intercepted", "LOW");
        return false;
      }

      // 8. Block Ctrl+A (Select All on document)
      if (isCtrlOrMeta && key === "a") {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== "textarea" && activeTag !== "input") {
          e.preventDefault();
          e.stopPropagation();
          recordIntegrityEvent("COPY_ATTEMPT", "Select All shortcut intercepted", "LOW");
          return false;
        }
      }
    };

    // 3. Context Menu (Right Click) Prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      recordIntegrityEvent("DEVTOOLS_SHORTCUT", "Right-click context menu intercepted", "LOW");
      return false;
    };

    // 4. Focus & Tab Switching Detection
    const handleWindowBlur = () => {
      recordIntegrityEvent("WINDOW_BLUR", "Assessment window lost focus", "MEDIUM");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordIntegrityEvent("TAB_HIDDEN", "Candidate switched tab or minimized browser window", "MEDIUM");
      }
    };

    // 5. BeforeUnload Page Refresh Warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "An active assessment is in progress. Leaving may affect your integrity evaluation.";
      recordIntegrityEvent("PAGE_REFRESH_ATTEMPT", "Attempted page refresh or navigation mid-turn", "LOW");
      return e.returnValue;
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActive, recordIntegrityEvent]);

  const clearWarning = useCallback(() => {
    setLastWarning(null);
  }, []);

  const getIntegritySummary = useCallback((): IntegritySummary => {
    const status =
      integrityScore >= 85
        ? "VERIFIED_SECURE"
        : integrityScore >= 60
        ? "MINOR_FLAGS"
        : "INTEGRITY_REVIEW";

    return {
      integrityScore,
      flagsCount: integrityEvents.length,
      status,
      events: integrityEvents,
      multiTabPrevented: isMultiTabLocked,
    };
  }, [integrityScore, integrityEvents, isMultiTabLocked]);

  return {
    integrityScore,
    integrityEvents,
    isMultiTabLocked,
    lastWarning,
    clearWarning,
    recordIntegrityEvent,
    getIntegritySummary,
  };
}
