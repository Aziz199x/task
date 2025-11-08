"use client";

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: Awaited<ReturnType<typeof App.addListener>> | undefined;

    const register = async () => {
      listenerHandle = await App.addListener("backButton", () => {
        // If there is browser history, go back; otherwise minimize the app.
        if (window.history.length > 1 && location.pathname !== "/") {
          navigate(-1);
        } else {
          // On root or no history, avoid exiting app; minimize instead (Android only).
          App.minimizeApp?.();
        }
      });
    };

    register();

    return () => {
      listenerHandle?.remove();
    };
  }, [navigate, location.pathname]);

  return null;
};

export default BackButtonHandler;