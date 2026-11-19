import { useState } from "react";

import "./SeatCountPopup.css";

function SeatCountPopup({ show, onClose, onConfirm }) {
  const [count, setCount] = useState(1);

  if (!show) return null;

  return (
    <div className="overlay">
      <div className="popup">
        <h3>Select Number of Seats</h3>
        <input
          type="number"
          min="1"
          max="10"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="seat-input"
        />
        <div className="popup-actions">
          <button className="confirm-btn" onClick={() => onConfirm(count)}>
            Confirm
          </button>
          <button className="close-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeatCountPopup;
