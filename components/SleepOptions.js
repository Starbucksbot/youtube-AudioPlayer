import { useState } from 'react';

export default function SleepOptions({ show, onClose, onSet }) {
  const [selectedTime, setSelectedTime] = useState(12);

  const handleSet = () => {
    onSet(selectedTime);
  };

  if (!show) return null;

  return (
    <div className="sleep-options active">
      <select value={selectedTime} onChange={(e) => setSelectedTime(parseInt(e.target.value))}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
          <option key={hour} value={hour}>
            {hour} Hour{hour > 1 ? 's' : ''}
          </option>
        ))}
      </select>
      <button onClick={handleSet}>Set</button>
    </div>
  );
}