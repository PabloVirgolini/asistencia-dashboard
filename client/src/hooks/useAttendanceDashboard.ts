import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { UI_CONSTANTS } from "../config/constants";

export function useAttendanceDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("todos");
  const [showEncargados, setShowEncargados] = useState<boolean>(true);
  const [toleranciaMinutos, setToleranciaMinutos] = useState<number>(0);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const todayQuery = trpc.attendance.getTodayDate.useQuery();
  const sectorsQuery = trpc.attendance.getSectors.useQuery();

  const attendanceQuery = trpc.attendance.getByDate.useQuery(
    {
      date: selectedDate || todayQuery.data?.date || "",
      sector: selectedSector === "todos" ? undefined : selectedSector,
      toleranciaMinutos: toleranciaMinutos,
    },
    {
      enabled: !!selectedDate || !!todayQuery.data?.date,
    }
  );

  useEffect(() => {
    if (todayQuery.data?.date && !selectedDate) {
      setSelectedDate(todayQuery.data.date);
    }
  }, [todayQuery.data?.date]);

  useEffect(() => {
    const calculateNextUpdateTime = () => {
      const now = new Date();
      const nextRefresh = new Date(now.getTime() + UI_CONSTANTS.DASHBOARD_REFRESH_INTERVAL_MS);
      return nextRefresh;
    };

    const scheduleNextUpdate = () => {
      const nextUpdate = calculateNextUpdateTime();
      setNextUpdateTime(nextUpdate);

      const timeUntilNextRefresh = nextUpdate.getTime() - Date.now();

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        attendanceQuery.refetch();
        scheduleNextUpdate();
      }, timeUntilNextRefresh);
    };

    scheduleNextUpdate();

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateTimeRemaining = () => {
    if (!nextUpdateTime) return { minutes: 0, seconds: 0 };
    const diff = nextUpdateTime.getTime() - currentTime.getTime();
    if (diff <= 0) return { minutes: 0, seconds: 0 };
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const timeRemaining = calculateTimeRemaining();

  const isLoading = todayQuery.isLoading || attendanceQuery.isLoading;
  const isError = todayQuery.isError || attendanceQuery.isError;

  return {
    selectedDate, setSelectedDate,
    selectedSector, setSelectedSector,
    showEncargados, setShowEncargados,
    toleranciaMinutos, setToleranciaMinutos,
    sectorsQuery,
    attendanceQuery,
    timeRemaining,
    isLoading,
    isError
  };
}
