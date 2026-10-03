import React, { useMemo } from "react";
import { Alert } from "react-native";
import { Href, Redirect, router, useLocalSearchParams } from "expo-router";
import { CheckNearbyReportsScreen } from "@/components/reportes/verificar-cercanos-screen";
import { Coordenadas } from "@/types";

type ValidNearbyParams = {
  coordinates: Coordenadas;
  typeId: string;
  next?: string;
};

function getParam(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function parseNearbyParams(
  latParam?: string | string[],
  lngParam?: string | string[],
  typeIdParam?: string | string[],
  nextParam?: string | string[],
): ValidNearbyParams | null {
  const latStr = getParam(latParam);
  const lngStr = getParam(lngParam);
  const typeId = getParam(typeIdParam);
  const next = getParam(nextParam);

  if (!latStr || !lngStr || !typeId) {
    return null;
  }

  const latitud = Number(latStr);
  const longitud = Number(lngStr);

  const isValid =
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180;

  if (!isValid) {
    return null;
  }

  return {
    coordinates: { latitud, longitud },
    typeId,
    next: next?.trim() || undefined,
  };
}

export default function NearbyReportsRoute() {
  const {
    latitud,
    longitud,
    tipoId,
    next: nextParam,
  } = useLocalSearchParams<{
    latitud?: string;
    longitud?: string;
    tipoId?: string;
    next?: string;
  }>();

  const parsed = useMemo(
    () => parseNearbyParams(latitud, longitud, tipoId, nextParam),
    [latitud, longitud, tipoId, nextParam],
  );

  if (!parsed) {
    return <Redirect href="/" />;
  }

  const { coordinates, typeId, next } = parsed;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleContinueNew = () => {
    if (next) {
      router.push(next as Href);
    } else {
      Alert.alert(
        "Nuevo Reporte",
        "Continuando al formulario de nuevo reporte...",
      );
    }
  };

  const handleAdhereSuccess = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <CheckNearbyReportsScreen
      userCoordinates={coordinates}
      typeId={typeId}
      onBack={handleBack}
      onContinueNew={handleContinueNew}
      onAdhereSuccess={handleAdhereSuccess}
    />
  );
}
