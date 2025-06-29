// components/ScoreSidebar.js
import React, { useState, useEffect } from 'react';
import './ScoreSidebar.css';
import { saveImage } from './db';
const LOCAL_STORAGE_KEY = 'pageTurner_savedScores';

const ScoreSidebar = ({ onSelectScore, currentSheetImages, currentMarkers }) => {
  const [savedScores, setSavedScores] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setSavedScores(JSON.parse(saved));
    }
  }, []);

  const saveCurrentScore = async () => {
    try {
      const name = prompt("请输入谱子名称：");
      if (!name) return;
  
      const id = Date.now();
      const imageKeys = [];
  
      for (let i = 0; i < currentSheetImages.length; i++) {
        const base64 = currentSheetImages[i];
        const res = await fetch(base64);
        if (!res.ok) throw new Error(`Invalid Base64 data for image ${i}`);
        const blob = await res.blob();
        const key = `score-${id}-${i}`;
        await saveImage(key, blob);
        imageKeys.push(key);
      }
  
      const newEntry = { id, name, markers: currentMarkers, imageKeys };
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const updatedScores = [newEntry, ...saved];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedScores));
      setSavedScores(updatedScores);
    } catch (error) {
      console.error("保存谱子失败：", error);
      alert("保存谱子失败，请检查图片数据或浏览器存储权限");
    }
  };

  const deleteScore = (id) => {
    const filtered = savedScores.filter(score => score.id !== id);
    setSavedScores(filtered);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  };

  const handleSelect = (score) => {
    if (onSelectScore) {
      onSelectScore(score);
    }
  };

  return (
    <>
    <div className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '⮜' : '谱子'}
    </div>
    <div className={`score-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
        <div className="sidebar-header">
            <h3>谱子管理</h3>
            <button onClick={saveCurrentScore}>保存当前谱子</button>
        </div>
        </div>
        <ul className="score-list">
        {savedScores.map(score => (
            <li key={score.id}>
            <span onClick={() => handleSelect(score)}>{score.name}</span>
            <button onClick={() => deleteScore(score.id)}>✕</button>
            </li>
        ))}
        </ul>
    </div>
    </>


  );
};

export default ScoreSidebar;