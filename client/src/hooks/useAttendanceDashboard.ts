import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

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
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0);
      nextHour.setSeconds(0);
      nextHour.setMilliseconds(0);
      return nextHour;
    };

    const scheduleNextUpdate = () => {
      const nextUpdate = calculateNextUpdateTime();
      setNextUpdateTime(nextUpdate);

      const timeUntilNextHour = nextUpdate.getTime() - Date.now();

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        attendanceQuery.refetch();
        scheduleNextUpdate();
      }, timeUntilNextHour);
    };

    scheduleNextUpdate();

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const calculateTimeRemaining = () => {
    if (!nextUpdateTime) return { minutes: 0, seconds: 0 };
    const now = new Date();
    const diff = nextUpdateTime.getTime() - now.getTime();
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
