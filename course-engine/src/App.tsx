import React, { useState, useEffect } from 'react';
import { Course } from './types/course';
import { sampleCourse } from './data/sample-course';
import { BuilderView } from './components/builder/BuilderView';
import { PlayerView } from './components/player/PlayerView';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'builder' | 'player'>('builder');

  const [course, setCourse] = useState<Course>(() => {
    try {
      const saved = localStorage.getItem('course_engine_active_course');
      return saved ? JSON.parse(saved) : sampleCourse;
    } catch {
      return sampleCourse;
    }
  });

  // Persist course changes
  useEffect(() => {
    try {
      localStorage.setItem('course_engine_active_course', JSON.stringify(course));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [course]);

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans">
      {mode === 'builder' ? (
        <BuilderView
          course={course}
          onChangeCourse={setCourse}
          onSwitchToPlayer={() => setMode('player')}
        />
      ) : (
        <PlayerView
          course={course}
          onBackToBuilder={() => setMode('builder')}
        />
      )}
    </div>
  );
};

export default App;
