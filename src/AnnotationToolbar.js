import React from 'react';
import './AnnotationToolbar.css';

// Import sticker images
// Assuming the icon folder is in src/assets/icons/ based on standard practice.
// If the path is different, we can adjust it.
import sticker_button_img from './assets/icons/group 1.png';
import sticker1 from './assets/icons/1.png';
import sticker2 from './assets/icons/2.png';
import sticker3 from './assets/icons/3.png';
import sticker4 from './assets/icons/4.png';
import sticker5 from './assets/icons/5.png';
import sticker6 from './assets/icons/6.png';
import sticker7 from './assets/icons/7.png';
import sticker8 from './assets/icons/8.png';
import sticker9 from './assets/icons/9.png';
import sticker10 from './assets/icons/10.png';
import sticker11 from './assets/icons/11.png';
import sticker12 from './assets/icons/12.png';
import sticker13 from './assets/icons/13.png';
import bubbleIcon from './assets/icons/bubble.png';

const stickers = [
  { id: 'sticker1', src: sticker1 },
  { id: 'sticker2', src: sticker2 },
  { id: 'sticker4', src: sticker4 },
  { id: 'sticker5', src: sticker5 },
  { id: 'sticker6', src: sticker6 },
  { id: 'sticker7', src: sticker7 },
  { id: 'sticker8', src: sticker8 },
  { id: 'sticker9', src: sticker9 },
  { id: 'sticker10', src: sticker10 },
  { id: 'sticker11', src: sticker11 },
  { id: 'sticker12', src: sticker12 },
  { id: 'sticker13', src: sticker13 },
];

const AnnotationToolbar = ({ isAnnotationMode, toggleAnnotationMode, selectedTool, setSelectedTool }) => {
  return (
    <div className="annotation-toolbar">
      <button 
        className={`annotation-mode-button ${isAnnotationMode ? 'active' : ''}`} 
        onClick={toggleAnnotationMode}
      >
        <img src={sticker_button_img} alt="Annotation Mode" />
      </button>
      {isAnnotationMode && (
        <div className="sticker-panel">
          <div
            key="brush"
            className={`sticker-item ${selectedTool === 'brush' ? 'selected' : ''}`}
            onClick={() => setSelectedTool('brush')}
            title="»­±Ê"
          >
            <img src={sticker3} alt="Brush" />
          </div>
          <div
            key="text"
            className={`sticker-item ${selectedTool === 'text' ? 'selected' : ''}`}
            onClick={() => setSelectedTool('text')}
            title="ÎÄ±¾"
          >
            <img src={bubbleIcon} alt="Text" style={{ padding: '5px' }} />
          </div>
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`sticker-item ${selectedTool === sticker.src ? 'selected' : ''}`}
              onClick={() => setSelectedTool(sticker.src)}
            >
              <img src={sticker.src} alt={sticker.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar; 