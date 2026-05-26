import React from 'react';
import { useParams } from 'react-router-dom';
import WeeklyCalendar from './WeeklyCalendar';
import MonthlyCalendar from './MonthlyCalendar';

const CalendarContainer = () => {
    const { view } = useParams();
    const calendarView = view || 'week';

    return (
        <>
            {calendarView === 'month' ? <MonthlyCalendar /> : <WeeklyCalendar />}
        </>
    );
};

export default CalendarContainer;
