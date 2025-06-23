import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import "./App.css";
import { getImage } from './db';
import ScoreSidebar from './ScoreSidebar';

function CircularProgress({ pauseDuration, remainingTime }) {
  const circumference = 100;
  const progress = ((pauseDuration - remainingTime) / pauseDuration) * 100;
  const remainingSeconds = remainingTime / 1000;

  return (
    <div className="circular-progress">
      <svg viewBox="0 0 36 36" className="progress-circle">
        <circle
          className="circle-bg"
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#444"
          strokeWidth="4"
        />
        <circle
          className="circle-progress"
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#4caf50"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={(1 - progress / 100) * circumference}
        />
      </svg>
      <div className="progress-text">{remainingSeconds.toFixed(1)}s</div>
    </div>
  );
}

const App = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const lastDragTimeRef = useRef(0); // Track last drag end time
  const [sheetWidth, setSheetWidth] = useState(70);
  const [pauseDuration, setPauseDuration] = useState(2000);
  const [markersPerPage, setMarkersPerPage] = useState(2);
  const [totalPages, setTotalPages] = useState(2);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceMarkers, setPracticeMarkers] = useState([]);
  const scrollTopRef = useRef(null);
  const isScrollingRef = useRef(isScrolling); // Track isScrolling changes

  const initializeMarkers = useCallback((numMarkers, pages) => {
    const markers = [];
    for (let page = 0; page < pages; page++) {
      for (let i = 0; i < numMarkers; i++) {
        markers.push({
          id: page * numMarkers + i + 1,
          position: (i + 1) / (numMarkers + 1),
          page: page + 1,
        });
      }
    }
    return markers;
  }, []);

  const [markers, setMarkers] = useState(() => initializeMarkers(markersPerPage, totalPages));
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);
  const scrollAreaRef = useRef(null);
  const FIXED_SCROLL_DURATION = 1;
  const [remainingTime, setRemainingTime] = useState(pauseDuration);
  const [showProgress, setShowProgress] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [sheetImages, setSheetImages] = useState(['/sheet1.jpg', '/sheet2.jpg']);
  const [isUpdatingSheets, setIsUpdatingSheets] = useState(false);

  const smoothScrollTo = useCallback((element, target, duration, onComplete) => {
    const start = element.scrollTop;
    const distance = target - start;
    const startTime = performance.now();
    const easing = (t) => {
      if (t < 0.5) {
        return 16 * Math.pow(t, 5);
      } else {
        return 1 - Math.pow(-2 * t + 2, 5) / 2;
      }
    };
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      element.scrollTop = start + distance * easedProgress;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const handleSelectScore = async (score) => {
    if (!score) {
      alert("谱子数据为空");
      return;
    }
    sheetImages.forEach(url => URL.revokeObjectURL(url));
    setSheetImages([]);
    setPracticeMarkers([]);
    setIsPracticeMode(false);
    let images = [];
    try {
      if (score.imageKeys && Array.isArray(score.imageKeys) && score.imageKeys.length > 0) {
        const blobs = await Promise.all(
          score.imageKeys.map(async (key) => {
            const blob = await getImage(key);
            if (!blob) console.warn(`未找到图片：${key}`);
            return blob;
          })
        );
        images = blobs
          .filter(blob => blob instanceof Blob)
          .map(blob => URL.createObjectURL(blob));
        if (images.length === 0) {
          alert("无法从本地加载谱子图片，可能已被浏览器清除？");
          return;
        }
      } else if (score.images && Array.isArray(score.images) && score.images.length > 0) {
        images = score.images;
      } else {
        alert("该谱子不包含图像数据");
        return;
      }
      setSheetImages(images);
      setMarkers(score.markers || initializeMarkers(markersPerPage, images.length));
      setTotalPages(images.length);
      setCurrentMarkerIndex(0);
      setIsScrolling(false);
      setShowProgress(false);
    } catch (error) {
      console.error("加载谱子失败？", error);
      alert("加载谱子失败，请检查数据或浏览器缓存？");
    }
  };

  const countdownIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const isAtMarkerPosition = (scrollArea, marker, totalPages, containerHeight) => {
    if (!scrollArea || !marker) return false;
    const pageHeight = scrollArea.scrollHeight / totalPages;
    const targetScroll =
      pageHeight * (marker.page - 1) +
      pageHeight * marker.position -
      containerHeight / 2;
    const currentScroll = scrollArea.scrollTop;
    return Math.abs(currentScroll - targetScroll) < 10;
  };

  const scrollToNextMarker = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !isScrollingRef.current) {
      setShowProgress(false);
      console.log('scrollToNextMarker: No scrollArea or not scrolling, hiding timer');
      return;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const activeMarkers = isPracticeMode ? practiceMarkers : markers;
    const marker = activeMarkers[currentMarkerIndex];
    if (!marker) {
      setIsScrolling(false);
      isScrollingRef.current = false;
      setShowProgress(false);
      console.log('scrollToNextMarker: No marker, stopping scroll');
      return;
    }

    const containerHeight = window.innerHeight;
    const pageHeight = scrollArea.scrollHeight / totalPages;

    if (isAtMarkerPosition(scrollArea, marker, totalPages, containerHeight)) {
      setShowProgress(true);
      setRemainingTime(pauseDuration);
      console.log('scrollToNextMarker: At marker, showing timer');

      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 100) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            return 0;
          }
          return prev - 100;
        });
      }, 100);

      timeoutRef.current = setTimeout(() => {
        if (isPracticeMode) {
          setCurrentMarkerIndex((prev) => (prev + 1) % activeMarkers.length);
        } else if (currentMarkerIndex + 1 >= activeMarkers.length) {
          setIsScrolling(false);
          isScrollingRef.current = false;
          setShowProgress(false);
          console.log('scrollToNextMarker: End of markers, stopping');
          return;
        } else {
          setCurrentMarkerIndex((prev) => prev + 1);
        }
      }, pauseDuration);
    } else {
      if (isDragging) {
        setShowProgress(true);
        console.log('scrollToNextMarker: Dragging, showing timer');
        return;
      }

      const targetScroll =
        pageHeight * (marker.page - 1) +
        pageHeight * marker.position -
        containerHeight / 2;

      smoothScrollTo(scrollArea, targetScroll, FIXED_SCROLL_DURATION, () => {
        if (!isScrollingRef.current) {
          setShowProgress(false);
          console.log('scrollToNextMarker: Scroll stopped, hiding timer');
          return;
        }

        setShowProgress(true);
        setRemainingTime(pauseDuration);
        console.log('scrollToNextMarker: Scroll complete, showing timer');

        countdownIntervalRef.current = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 100) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              return 0;
            }
            return prev - 100;
          });
        }, 100);

        timeoutRef.current = setTimeout(() => {
          if (isPracticeMode) {
            setCurrentMarkerIndex((prev) => (prev + 1) % activeMarkers.length);
          } else if (currentMarkerIndex + 1 >= activeMarkers.length) {
            setIsScrolling(false);
            isScrollingRef.current = false;
            setShowProgress(false);
            console.log('scrollToNextMarker: End of markers, stopping');
            return;
          } else {
            setCurrentMarkerIndex((prev) => prev + 1);
          }
        }, pauseDuration);
      });
    }
  }, [isDragging, currentMarkerIndex, markers, practiceMarkers, isPracticeMode, pauseDuration, smoothScrollTo, totalPages]);

  useEffect(() => {
    isScrollingRef.current = isScrolling; // Sync ref with state
    console.log('isScrollingRef updated:', isScrolling);
  }, [isScrolling]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const scrollArea = scrollAreaRef.current;
    const activeMarkers = isPracticeMode ? practiceMarkers : markers;
    console.log('useEffect: Checking scroll', {
      scrollArea: !!scrollArea,
      activeMarkers: activeMarkers.length,
      isDragging,
      justFinishedDragging,
      timeSinceDrag: now - lastDragTimeRef.current
    });

    if (!scrollArea || activeMarkers.length === 0 || isDragging || justFinishedDragging || (now - lastDragTimeRef.current < 100)) {
      if (justFinishedDragging) {
        setJustFinishedDragging(false);
        console.log('useEffect: Skipped due to justFinishedDragging');
      }
      if (now - lastDragTimeRef.current < 100) {
        console.log('useEffect: Skipped due to recent drag');
      }
      return;
    }

    const marker = activeMarkers[0];
    const containerHeight = window.innerHeight;
    const pageHeight = scrollArea.scrollHeight / totalPages;
    const targetScroll =
      pageHeight * (marker.page - 1) +
      pageHeight * marker.position -
      containerHeight / 2;

    console.log('useEffect: Scrolling to first marker');
    smoothScrollTo(scrollArea, targetScroll, FIXED_SCROLL_DURATION);
  }, [markers, practiceMarkers, isPracticeMode, isDragging, justFinishedDragging, smoothScrollTo, totalPages]);

  useLayoutEffect(() => {
    if (isScrolling) {
      const activeMarkers = isPracticeMode ? practiceMarkers : markers;
      console.log('useLayoutEffect: Checking markers', {
        currentMarkerIndex,
        activeMarkersLength: activeMarkers.length
      });
      if (activeMarkers.length === 0) {
        setIsScrolling(false);
        isScrollingRef.current = false;
        setShowProgress(false);
        console.log('useLayoutEffect: No markers, stopping scroll and hiding timer');
        return;
      }
      if (currentMarkerIndex < 0 || currentMarkerIndex >= activeMarkers.length) {
        setCurrentMarkerIndex(0); // Reset to valid index
        console.log('useLayoutEffect: Invalid marker index, resetting to 0');
      }
      setShowProgress(true);
      console.log('useLayoutEffect: Setting showProgress to true');
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) {
        console.log('useLayoutEffect: No scrollArea, skipping');
        return;
      }
      requestAnimationFrame(() => {
        scrollToNextMarker();
      });
    } else {
      setShowProgress(false);
      console.log('useLayoutEffect: isScrolling false, hiding timer');
    }
  }, [isScrolling, currentMarkerIndex, scrollToNextMarker, markers, practiceMarkers, isPracticeMode]);

  const handleMarkerDrag = useCallback((markerId, newPosition) => {
    const updateMarkers = (prevMarkers) =>
      prevMarkers.map(marker =>
        marker.id === markerId
          ? { ...marker, position: Math.max(0, Math.min(1, newPosition)) }
          : marker
      );
    if (isPracticeMode) {
      setPracticeMarkers(prev => updateMarkers(prev));
    } else {
      setMarkers(prev => updateMarkers(prev));
    }
  }, [isPracticeMode]);

  const handlePauseDurationChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 500) {
      setPauseDuration(value);
    }
  };

  const handleMarkersPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setMarkersPerPage(value);
      setMarkers(initializeMarkers(value, totalPages));
      setCurrentMarkerIndex(0);
    }
  };

  const scrollToMarker = useCallback((direction) => {
    if (isDragging) return;
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const activeMarkers = isPracticeMode ? practiceMarkers : markers;
    const totalMarkers = activeMarkers.length;
    let nextIndex;

    if (direction === 'up') {
      nextIndex = currentMarkerIndex > 0 ? currentMarkerIndex - 1 : totalMarkers - 1;
    } else {
      nextIndex = currentMarkerIndex < totalMarkers - 1 ? currentMarkerIndex + 1 : 0;
    }

    const marker = activeMarkers[nextIndex];
    if (!marker) return;

    const containerHeight = window.innerHeight;
    const pageHeight = scrollArea.scrollHeight / totalPages;
    const targetScroll =
      pageHeight * (marker.page - 1) +
      pageHeight * marker.position -
      containerHeight / 2;

    smoothScrollTo(scrollArea, targetScroll, FIXED_SCROLL_DURATION, () => {
      setCurrentMarkerIndex(nextIndex);
      setIsScrolling(false);
      isScrollingRef.current = false;
    });
  }, [currentMarkerIndex, markers, practiceMarkers, isPracticeMode, isDragging, smoothScrollTo, totalPages]);

  const getCurrentMarkerText = () => {
    const activeMarkers = isPracticeMode ? practiceMarkers : markers;
    if (currentMarkerIndex < 0) {
      return "未开始";
    } else if (currentMarkerIndex >= activeMarkers.length) {
      return "已结束";
    } else {
      const marker = activeMarkers[currentMarkerIndex];
      return `第${marker.page}页 ${(marker.position * 100).toFixed(0)}%`;
    }
  };

  const addMarker = (page, position, currentId) => {
    if (isPracticeMode) {
      setPracticeMarkers((prev) => {
        const newId = prev.length + 1;
        const newMarker = { id: newId, position: Math.max(0, Math.min(1, position)), page };
        return [...prev, newMarker];
      });
    } else {
      setMarkers((prevMarkers) => {
        const newPosition = Math.min(Math.max(position + 0.1, 0), 1);
        const newMarker = { id: currentId + 1, position: newPosition, page };
        const updatedMarkers = prevMarkers.map(marker => {
          if (marker.id > currentId) {
            return { ...marker, id: marker.id + 1 };
          }
          return marker;
        });
        return [...updatedMarkers, newMarker].sort((a, b) => a.id - b.id);
      });
    }
  };

  const deleteMarker = (markerId) => {
    if (isPracticeMode) {
      setPracticeMarkers((prev) => prev.filter(marker => marker.id !== markerId));
    } else {
      setMarkers((prevMarkers) => prevMarkers.filter(marker => marker.id !== markerId));
    }
  };

  const togglePracticeMode = () => {
    setIsPracticeMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        setPracticeMarkers([]);
        setCurrentMarkerIndex(0);
        setIsScrolling(false);
        isScrollingRef.current = false;
        setShowProgress(false);
      }
      return newMode;
    });
  };

  const handleSheetClick = (e, pageNum) => {
    e.preventDefault();
    e.stopPropagation();
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const containerHeight = container.offsetHeight;
    const position = clickY / containerHeight;
    addMarker(pageNum + 1, position, isPracticeMode ? practiceMarkers.length : markers.reduce((max, m) => Math.max(max, m.id), 0));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file =>
      file.type === "image/jpeg" || file.type === "image/png"
    );

    const fileReaders = imageFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            url: e.target.result,
            order: uploadedFiles.length + imageFiles.indexOf(file) + 1
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReaders).then(results => {
      setUploadedFiles(prev => [...prev, ...results].sort((a, b) => a.order - b.order));
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      const [draggedItem] = newFiles.splice(dragIndex, 1);
      newFiles.splice(dropIndex, 0, draggedItem);
      return newFiles.map((file, index) => ({
        ...file,
        order: index + 1
      }));
    });
  };

  const handleConfirmUpload = () => {
    if (uploadedFiles.length === 0) return;
    setIsUpdatingSheets(true);
    setIsScrolling(false);
    isScrollingRef.current = false;
    setCurrentMarkerIndex(0);
    setShowProgress(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    requestAnimationFrame(() => {
      const newSheets = uploadedFiles.map(file => file.url);
      setSheetImages(newSheets);
      setTotalPages(newSheets.length);
      setMarkers(initializeMarkers(markersPerPage, newSheets.length));
      setPracticeMarkers([]);
      setIsPracticeMode(false);
      setShowUpload(false);
      setIsUpdatingSheets(false);
    });
  };

  useEffect(() => {
    const preventTouchScroll = (e) => {
      if (e.target.closest('.sheet-marker')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-title">PageTurner</div>
        <div className="header-actions">
          <button
            className={`upload-button practice-mode-btn${isPracticeMode ? ' active' : ''}`}
            onClick={togglePracticeMode}
          >
            <span className="icon">{isPracticeMode ? '✅' : '🎵'}</span>
            {isPracticeMode ? '退出练习' : '练习模式'}
          </button>
          <button
            className="upload-button"
            onClick={() => setShowUpload(true)}
          >
            <span className="icon">📤</span> 上传谱子
          </button>
          <button
            className="settings-toggle"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l-.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v-.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l-.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>
      <div className="container">
        <ScoreSidebar
          onSelectScore={handleSelectScore}
          currentSheetImages={sheetImages}
          currentMarkers={isPracticeMode ? practiceMarkers : markers}
        />
        <div className={`settings ${settingsOpen ? 'open' : ''}`}>
          <label>
            每页标记数量:
            <input
              type="number"
              value={markersPerPage}
              onChange={handleMarkersPerPageChange}
              min="1"
              disabled={isPracticeMode}
            />
          </label>
          <label>
            乐谱宽度 (%):
            <input
              type="number"
              value={sheetWidth}
              onChange={(e) => setSheetWidth(Number(e.target.value))}
            />
          </label>
          <label>
            停顿时间 (ms):
            <input
              type="number"
              value={pauseDuration}
              onChange={handlePauseDurationChange}
              min="500"
              max="5000"
              step="100"
            />
          </label>
          <div className="timing-info">
            每页演奏时间: {((pauseDuration * 3 + FIXED_SCROLL_DURATION * 3) / 1000).toFixed(1)} 秒
          </div>
          <div className="timing-info">
            当前位置：{getCurrentMarkerText()}
          </div>
          <div className="debug-info" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            <h4>Debug Variables:</h4>
            <div>currentMarkerIndex: {currentMarkerIndex}</div>
            <div>isScrolling: {isScrolling.toString()}</div>
            <div>isDragging: {isDragging.toString()}</div>
            <div>justFinishedDragging: {justFinishedDragging.toString()}</div>
            <div>showProgress: {showProgress.toString()}</div>
            <div>markers.length: {(isPracticeMode ? practiceMarkers : markers).length}</div>
            <div>isPracticeMode: {isPracticeMode.toString()}</div>
            <div>markers:</div>
            <div style={{ fontSize: '12px', marginLeft: '10px' }}>
              {(isPracticeMode ? practiceMarkers : markers).map((marker, index) => (
                <div key={marker.id}>
                  id: {marker.id}, page: {marker.page}, position: {marker.position}
                  {index === currentMarkerIndex ? ' (current)' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
        {!isUpdatingSheets && (
          <div
            className="scrollArea"
            ref={scrollAreaRef}
            style={{
              width: `${sheetWidth}%`,
              '--sheet-width': `${sheetWidth}%`
            }}
          >
            {sheetImages.map((imageUrl, pageNum) => (
              <div key={`page-${pageNum}-${imageUrl}`} className="sheet-container">
                <img
                  src={imageUrl}
                  alt={`乐谱 ${pageNum + 1}`}
                  className="sheet"
                />
                <div
                  className="clickable-edge"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '30px',
                    height: '100%',
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.1)',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => isPracticeMode && (e.currentTarget.style.opacity = '0.3')}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  onClick={(e) => isPracticeMode && handleSheetClick(e, pageNum)}
                />
                {(isPracticeMode ? practiceMarkers : markers)
                  .filter(marker => marker.page === pageNum + 1)
                  .map((marker) => (
                    <div
                      key={`marker-${marker.id}-${pageNum}`}
                      className={`sheet-marker ${isPracticeMode ? 'practice-marker' : ''}`}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: `${marker.position * 100}%`,
                        transform: 'translateY(-50%)',
                        cursor: 'ns-resize',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                        scrollTopRef.current = scrollAreaRef.current.scrollTop;
                        const container = e.currentTarget.parentElement;
                        const startY = e.clientY;
                        const startPos = marker.position;

                        const handleMouseMove = (moveEvent) => {
                          moveEvent.preventDefault();
                          moveEvent.stopPropagation();
                          if (scrollAreaRef.current && scrollTopRef.current !== null) {
                            scrollAreaRef.current.scrollTop = scrollTopRef.current;
                          }
                          const deltaY = moveEvent.clientY - startY;
                          const containerHeight = container.offsetHeight;
                          const newPosition = startPos + (deltaY / containerHeight);
                          handleMarkerDrag(marker.id, newPosition);
                        };

                        const handleMouseUp = () => {
                          setIsDragging(false);
                          setJustFinishedDragging(true);
                          lastDragTimeRef.current = Date.now();
                          console.log('Mouse up: Drag ended, set lastDragTime');
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                        scrollTopRef.current = scrollAreaRef.current.scrollTop;
                        const touch = e.touches[0];
                        const container = e.currentTarget.parentElement;
                        const startY = touch.clientY;
                        const startPos = marker.position;

                        const handleTouchMove = (moveEvent) => {
                          moveEvent.preventDefault();
                          moveEvent.stopPropagation();
                          if (scrollAreaRef.current && scrollTopRef.current !== null) {
                            scrollAreaRef.current.scrollTop = scrollTopRef.current;
                          }
                          const touchMove = moveEvent.touches[0];
                          const deltaY = touchMove.clientY - startY;
                          const containerHeight = container.offsetHeight;
                          const newPosition = startPos + (deltaY / containerHeight);
                          handleMarkerDrag(marker.id, newPosition);
                        };

                        const handleTouchEnd = () => {
                          setIsDragging(false);
                          setJustFinishedDragging(true);
                          lastDragTimeRef.current = Date.now();
                          console.log('Touch end: Drag ended, set lastDragTime');
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        };

                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                        document.addEventListener('touchend', handleTouchEnd);
                      }}
                    >
                      {isPracticeMode ? (
                        <>
                          <span>{marker.id}</span>
                          <div className="marker-buttons">
                            <div className="marker-button" onClick={() => addMarker(pageNum + 1, marker.position, marker.id)}>+</div>
                            <div className="marker-button" onClick={() => deleteMarker(marker.id)}>-</div>
                          </div>
                        </>
                      ) : (
                        <div className="marker-buttons">
                          <div className="marker-button" onClick={() => addMarker(pageNum + 1, marker.position, marker.id)}>+</div>
                          <div className="marker-button" onClick={() => deleteMarker(marker.id)}>-</div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
        <div className="controlButtons">
          <button className="upButton" onClick={() => scrollToMarker('up')}></button>
          <button
            className="controlButton"
            onClick={() => {
              if (!isScrolling) {
                const activeMarkers = isPracticeMode ? practiceMarkers : markers;
                if (activeMarkers.length === 0) {
                  console.log('Control Start: No markers available, aborting');
                  return;
                }
                setIsScrolling(true);
                isScrollingRef.current = true;
                setRemainingTime(pauseDuration);
                setShowProgress(true);
                console.log('Control Start: showProgress set to true');
                if (currentMarkerIndex === -1 || currentMarkerIndex >= activeMarkers.length) {
                  setCurrentMarkerIndex(0);
                  const scrollArea = scrollAreaRef.current;
                  if (scrollArea && activeMarkers.length > 0) {
                    const marker = activeMarkers[0];
                    const containerHeight = window.innerHeight;
                    const pageHeight = scrollArea.scrollHeight / totalPages;
                    const targetScroll =
                      pageHeight * (marker.page - 1) +
                      pageHeight * marker.position -
                      containerHeight / 2;
                    smoothScrollTo(scrollArea, targetScroll, FIXED_SCROLL_DURATION);
                  }
                }
              } else {
                setIsScrolling(false);
                isScrollingRef.current = false;
                clearInterval(countdownIntervalRef.current);
                clearTimeout(timeoutRef.current);
                setShowProgress(false);
                console.log('Control Stop: showProgress set to false');
              }
            }}
          >
            {isScrolling ? "停止" : "开始"}
          </button>
          <button className="downButton" onClick={() => scrollToMarker('down')}></button>
        </div>
        {showProgress && (
          <div className="progress-container">
            <CircularProgress
              pauseDuration={pauseDuration}
              remainingTime={remainingTime}
            />
          </div>
        )}
        <div className={`upload-area ${showUpload ? 'show' : ''}`}>
          <h3>上传乐谱</h3>
          <div
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              handleFileUpload({ target: { files } });
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <p>点击或拖拽文件到此处上传</p>
            <p className="text-sm text-gray-500">支持 JPG、PNG 格式</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/jpeg,image/png"
            multiple
            style={{ display: 'none' }}
          />
          <div className="upload-preview">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="preview-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="preview-order">{file.order}</div>
                <img src={file.url} alt={file.name} />
              </div>
            ))}
          </div>
          <div className="upload-actions">
            <button
              className="upload-button-secondary"
              onClick={() => setShowUpload(false)}
            >
              取消
            </button>
            <button
              className="upload-button-primary"
              onClick={handleConfirmUpload}
            >
              确认上传
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;