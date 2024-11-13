import React, { useState, useEffect } from "react";
import axios from "axios";

interface WorkSession {
    id?: number;
    date: string;
    duration: number;
}

const TimeTracker: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
    const [currentDuration, setCurrentDuration] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning && startTime) {
            interval = setInterval(() => {
                const now = new Date();
                const duration = Math.floor(
                    (now.getTime() - startTime.getTime()) / 1000
                );
                setCurrentDuration(duration);
            }, 1000);
        } else if (!isRunning && interval) {
            clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, startTime]);

    const startTimer = () => {
        setIsRunning(true);
        setStartTime(new Date());
        setCurrentDuration(0); // Reset timer to zero on new session
    };

    const stopTimer = () => {
        setIsRunning(false);
        setShowConfirm(true);
    };

    const confirmAddTime = async () => {
        const currentDate = new Date().toISOString().split("T")[0];
        const todaySession = workSessions.find(
            (session) => session.date === currentDate
        );

        if (todaySession) {
            todaySession.duration += currentDuration;
            await axios.put(
                `http://localhost:5000/workSessions/${todaySession.id}`,
                todaySession
            );
        } else {
            const newSession = { date: currentDate, duration: currentDuration };
            const response = await axios.post(
                "http://localhost:5000/workSessions",
                newSession
            );
            setWorkSessions([...workSessions, response.data]);
        }

        setShowConfirm(false);
        setCurrentDuration(0); // Reset after saving
    };

    const cancelAddTime = () => {
        setShowConfirm(false);
        setCurrentDuration(0); // Reset if user cancels
    };

    useEffect(() => {
        const fetchWorkSessions = async () => {
            const response = await axios.get<WorkSession[]>(
                "http://localhost:5000/workSessions"
            );
            setWorkSessions(response.data);
        };

        fetchWorkSessions();
    }, []);

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4">Work Time Tracker</h1>
            <button
                onClick={isRunning ? stopTimer : startTimer}
                className="bg-blue-500 text-white px-4 py-2 rounded-md mb-2"
            >
                {isRunning ? "Stop" : "Start"}
            </button>

            <div className="text-lg">
                <p>
                    Today's Work Time: {Math.floor(currentDuration / 3600)}{" "}
                    hours {Math.floor((currentDuration % 3600) / 60)} minutes{" "}
                    {currentDuration % 60} seconds
                </p>
            </div>

            {showConfirm && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <p>
                        Current session time:{" "}
                        {Math.floor(currentDuration / 3600)} hours{" "}
                        {Math.floor((currentDuration % 3600) / 60)} minutes{" "}
                        {currentDuration % 60} seconds
                    </p>
                    <p>Do you want to add this time to today's total?</p>
                    <button
                        onClick={confirmAddTime}
                        className="bg-green-500 text-white px-4 py-2 rounded-md mt-2 mr-2"
                    >
                        Yes
                    </button>
                    <button
                        onClick={cancelAddTime}
                        className="bg-red-500 text-white px-4 py-2 rounded-md mt-2"
                    >
                        No
                    </button>
                </div>
            )}

            <h2 className="text-xl font-bold mt-4">Work History</h2>
            <ul className="mt-2">
                {workSessions.map((session) => (
                    <li key={session.date}>
                        {session.date}: {Math.floor(session.duration / 3600)}{" "}
                        hours {Math.floor((session.duration % 3600) / 60)}{" "}
                        minutes {session.duration % 60} seconds
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TimeTracker;
