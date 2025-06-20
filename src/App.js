import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import "./App.css";
import { getImage } from './db'; // 按路径调整
import ScoreSidebar from './ScoreSidebar';
function CircularProgress({ pauseDuration, remainingTime }) {
  const circumference = 100; // 圆形进度条的周长为 100
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
  const [sheetWidth, setSheetWidth] = useState(70);
  // const [bpm, setBpm] = useState(60);
  const [pauseDuration, setPauseDuration] = useState(2000);    // 控制停顿时间
  const [markersPerPage, setMarkersPerPage] = useState(2);     // 默认每页2个标记
  const [totalPages, setTotalPages] = useState(2);             // 修改为动态页数

  // 鍒濆鍖栨爣璁颁綅缃�
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

  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0); // 当前标记的索引

  const scrollAreaRef = useRef(null);

  const FIXED_SCROLL_DURATION = 1; // 2缁夛拷
  const [remainingTime, setRemainingTime] = useState(pauseDuration);
  const [showProgress, setShowProgress] = useState(false);

  const smoothScrollTo = useCallback((element, target, duration, onComplete) => {
    const start = element.scrollTop;  // 当前位置
    const distance = target - start;  // 需要滚动的距离
    const startTime = performance.now();  // 开始时间

    // 缓动函数
    const easing = (t) => {
      if (t < 0.5) {
        // 前半段
        return 16 * Math.pow(t, 5);
      } else {
        // 后半段
        return 1 - Math.pow(-2 * t + 2, 5) / 2;
      }
    };

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;  // 已经过去的时间
      const progress = Math.min(elapsed / duration, 1);  // 进度 [0, 1]

      // 使用缓动函数计算位置
      const easedProgress = easing(progress);

      // 更新滚动位置
      element.scrollTop = start + distance * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);  // 继续动画
      } else if (onComplete) {
        onComplete();  // 动画完成后的回调
      }
    };

    requestAnimationFrame(animate);  // 开始动画
  }, []);

  const handleSelectScore = async (score) => {
    if (!score) {
      alert("谱子数据为空");
      return;
    }
  
    // 清理旧的 URL 对象
    sheetImages.forEach(url => URL.revokeObjectURL(url));
    setSheetImages([]);
  
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
          alert("无法从本地加载谱子图片，可能已被浏览器清除。");
          return;
        }
      } else if (score.images && Array.isArray(score.images) && score.images.length > 0) {
        images = score.images;
      } else {
        alert("该谱子不包含图像数据");
        return;
      }
  
      setSheetImages(images);
      setMarkers(score.markers || []);
      setTotalPages(images.length);
      setCurrentMarkerIndex(0);
      setIsScrolling(false);
      setShowProgress(false);
    } catch (error) {
      console.error("加载谱子失败：", error);
      alert("加载谱子失败，请检查数据或浏览器存储");
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
    if (!scrollArea || !isScrolling) return;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const marker = markers[currentMarkerIndex];
    if (!marker) {
      setIsScrolling(false);
      setShowProgress(false);
      return;
    }

    const containerHeight = window.innerHeight;
    const pageHeight = scrollArea.scrollHeight / totalPages;

    if (isAtMarkerPosition(scrollArea, marker, totalPages, containerHeight)) {
      setShowProgress(true);
      setRemainingTime(pauseDuration);

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
        if (currentMarkerIndex + 1 >= markers.length) {
          setIsScrolling(false);
          setCurrentMarkerIndex(-1);
          setShowProgress(false);
          return;
        }
        setCurrentMarkerIndex((prev) => prev + 1);
      }, pauseDuration);
    } else {
      const targetScroll =
        pageHeight * (marker.page - 1) +
        pageHeight * marker.position -
        containerHeight / 2;

      smoothScrollTo(scrollArea, targetScroll, FIXED_SCROLL_DURATION, () => {
        if (!isScrolling) return;

        setShowProgress(true);
        setRemainingTime(pauseDuration);

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
          if (currentMarkerIndex + 1 >= markers.length) {
            setIsScrolling(false);
            setCurrentMarkerIndex(-1);
            setShowProgress(false);
            return;
          }
          setCurrentMarkerIndex((prev) => prev + 1);
        }, pauseDuration);
      });
    }
  }, [isScrolling, currentMarkerIndex, markers, pauseDuration, smoothScrollTo, totalPages]);

  // 娣囶喗鏁� useEffect 濞撳懐鎮婇崙鑺ユ殶
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
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || markers.length === 0) return;

    const marker = markers[0];
    const containerHeight = window.innerHeight;
    const pageHeight = scrollArea.scrollHeight / totalPages;
    const targetScroll =
      pageHeight * (marker.page - 1) +
      pageHeight * marker.position -
      containerHeight / 2;

    smoothScrollTo(scrollArea, targetScroll, FIXED_SCROLL_DURATION);
  }, [markers, smoothScrollTo, totalPages]);

  // 閸︼拷 useEffect 娑擃厼顦╅悶鍡氱箻鎼达附娼惃鍕閽橈拷
  useLayoutEffect(() => {
    if (isScrolling) {
      if (currentMarkerIndex < 0 || currentMarkerIndex >= markers.length) {
        setIsScrolling(false);
        setCurrentMarkerIndex(-1);
        setShowProgress(false);
        return;
      }
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;
      requestAnimationFrame(() => {
        scrollToNextMarker();
      });
    }
  }, [isScrolling, currentMarkerIndex, scrollToNextMarker, markers.length]);

  // 婢跺嫮鎮婇弽鍥唶閹锋牗瀚�
  const handleMarkerDrag = useCallback((markerId, newPosition) => {
    setMarkers(prevMarkers =>
      prevMarkers.map(marker =>
        marker.id === markerId
          ? { ...marker, position: Math.max(0, Math.min(1, newPosition)) }
          : marker
      )
    );
  }, []);

  // 婢跺嫮鎮婇崑婊堛€戦弮鍫曟？閸欐ê瀵�
  const handlePauseDurationChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 500) { // 鐠佸墽鐤嗛張鈧亸蹇撲粻妞ゆ寧妞傞梻缈犺礋500ms
      setPauseDuration(value);
    }
  };

  // 婢跺嫮鎮婇弽鍥唶閺佷即鍣洪崣妯哄
  const handleMarkersPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setMarkersPerPage(value);
      setMarkers(initializeMarkers(value, totalPages));
      setCurrentMarkerIndex(0);
    }
  };

  // 濞ｈ濮為幍瀣З閸掑洦宕查崚鐗堝瘹鐎规碍鐖ｇ拋鎵畱閸戣姤鏆�
  const scrollToMarker = useCallback((direction) => {
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

    const totalMarkers = markers.length;
    let nextIndex;

    if (direction === 'up') {
      nextIndex = currentMarkerIndex > 0 ? currentMarkerIndex - 1 : totalMarkers - 1;
    } else {
      nextIndex = currentMarkerIndex < totalMarkers - 1 ? currentMarkerIndex + 1 : 0;
    }

    const marker = markers[nextIndex];
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
    });
  }, [currentMarkerIndex, markers, smoothScrollTo, totalPages]);

  const getCurrentMarkerText = () => {
    if (currentMarkerIndex < 0) {
      return "未开始";
    } else if (currentMarkerIndex >= markers.length) {
      return "已结束";
    } else {
      const marker = markers[currentMarkerIndex];
      return `第${marker.page}页 ${(marker.position * 100).toFixed(0)}%`;
    }
  };

  // 濞ｈ濮為弽鍥唶
  const addMarker = (page, currentPosition, currentId) => {
    setMarkers((prevMarkers) => {
      // 娴ｈ法鏁よぐ鎾冲閺嶅洩顔囬惃鍕秴缂冾喕缍旀稉鍝勫棘閼板喛绱濋弬鐗堢垼鐠侀绱
      const newPosition = Math.min(Math.max(currentPosition + 0.1, 0), 1);

      const newMarker = {
        id: currentId + 1, // 閸︺劌缍嬮崜宥嗙垼鐠佹壆娈慽d閸╄櫣顢呮稉濠傚1
        position: newPosition,
        page: page,
      };

      // 閺囧瓨鏌婅ぐ鎾冲妞ら潧鎮楃紒顓熺垼鐠佹澘鎷伴崥搴ｇ敾妞ょ敻娼伴弽鍥唶閻ㄥ埇d
      const updatedMarkers = prevMarkers.map(marker => {
        if (marker.id > currentId) {
          // 閹碘偓閺堝"d婢堆傜艾瑜版挸澧犻弽鍥唶id閻ㄥ嫭鐖ｇ拋浼村厴闂団偓鐟曚巩d+1
          return { ...marker, id: marker.id + 1 };
        }
        return marker;
      });

      // 鐏忓棙鏌婇弽鍥唶閹绘帒鍙嗛崚鐗堫劀绾喚娈戞担宥囩枂
      return [...updatedMarkers, newMarker].sort((a, b) => a.id - b.id);
    });
  };

  // 閸掔娀娅庨弽鍥唶
  const deleteMarker = (markerId) => {
    setMarkers((prevMarkers) => prevMarkers.filter(marker => marker.id !== markerId));
  };

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

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

  // 婢跺嫮鎮婇幏鏍ㄥ閹烘帒绨�
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

      // 閺囧瓨鏌婃い鍝勭碍
      return newFiles.map((file, index) => ({
        ...file,
        order: index + 1
      }));
    });
  };

  // 绾喛顓绘稉濠佺炊
  const handleConfirmUpload = () => {
    if (uploadedFiles.length === 0) return;

    setIsUpdatingSheets(true);

    setIsScrolling(false);
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
      setShowUpload(false);
      setIsUpdatingSheets(false);
    });
  };

  // 濞ｈ濮為弬鎵畱閻樿埖鈧焦娼电€涙ê鍋嶇拫鍗炵摍閸ュ墽澧�
  const [sheetImages, setSheetImages] = useState(['/sheet1.jpg', '/sheet2.jpg']); // 姒涙ǹ顓荤拫鍗炵摍
  const [isUpdatingSheets, setIsUpdatingSheets] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-title">
          PageTurner
        </div>
        <div className="header-actions">
          <button
            className="upload-button"
            onClick={() => setShowUpload(true)}
          >
            <span className="icon">📤</span>
            上传谱子
          </button>
          <button
            className="settings-toggle"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>
      <div className="container">
        <ScoreSidebar
          onSelectScore={async (score) => {
            console.log("被选中的谱子对象：", score);

            if (!score) {
              alert("谱子数据为空");
              return;
            }

            let images = [];

            // ✅ 读取图像：从 IndexedDB 或 fallback 到旧格式
            if (score.imageKeys && Array.isArray(score.imageKeys)) {
              try {
                const blobs = await Promise.all(score.imageKeys.map(key => getImage(key)));

                // 检查 blob 有效性
                const validBlobs = blobs.filter(blob => blob instanceof Blob);

                // ✅ 调试输出：检测哪些 key 加载失败
                score.imageKeys.forEach((key, i) => {
                  if (!blobs[i]) {
                    console.warn(`未找到图片：${key}`);
                  }
                });

                if (validBlobs.length === 0) {
                  alert("无法从本地加载谱子图片，可能已被浏览器清除。");
                  return;
                }

                images = validBlobs.map(blob => URL.createObjectURL(blob));
              } catch (e) {
                console.error("从 IndexedDB 加载图像失败：", e);
                alert("谱子图像加载失败！");
                return;
              }
            } else if (score.images && Array.isArray(score.images)) {
              // fallback：支持老谱子（base64 图像）
              images = score.images;
            } else {
              alert("该谱子不包含图像数据");
              return;
            }

            // ✅ 正常设置状态
            setSheetImages(images);
            setMarkers(score.markers || []);
            setTotalPages(images.length);
            setCurrentMarkerIndex(0);
            setIsScrolling(false);
            setShowProgress(false);
            setShowUpload(false);
          }}
          currentSheetImages={sheetImages}
          currentMarkers={markers}
        />

        <div className={`settings ${settingsOpen ? 'open' : ''}`}>
          <label>
            每页标记数量:
            <input
              type="number"
              value={markersPerPage}
              onChange={handleMarkersPerPageChange}
              min="1"
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
            <div>markers.length: {markers.length}</div>
            <div>markers:</div>
            <div style={{ fontSize: '12px', marginLeft: '10px' }}>
              {markers.map((marker, index) => (
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
                  loading="lazy"
                />
                {markers
                  .filter(marker => marker.page === pageNum + 1)
                  .map((marker) => (
                    <div
                      key={`marker-${marker.id}-${pageNum}`}
                      className="sheet-marker"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: `${marker.position * 100}%`,
                        transform: 'translateY(-50%)',
                        cursor: 'ns-resize'
                      }}
                      onMouseDown={(e) => {
                        const container = e.currentTarget.parentElement;
                        const startY = e.clientY;
                        const startPos = marker.position;

                        const handleMouseMove = (moveEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const containerHeight = container.offsetHeight;
                          const newPosition = startPos + (deltaY / containerHeight);
                          handleMarkerDrag(marker.id, newPosition);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    >

                      <div className="marker-buttons">
                        <div className="marker-button" onClick={() => addMarker(pageNum + 1, marker.position, marker.id)}>+</div>
                        <div className="marker-button" onClick={() => deleteMarker(marker.id)}>-</div>
                      </div>
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
                setIsScrolling(true);
                setRemainingTime(pauseDuration);
                setShowProgress(true);
                // Reset to first marker if at end or invalid index
                if (currentMarkerIndex === -1 || currentMarkerIndex >= markers.length) {
                  setCurrentMarkerIndex(0);
                  const scrollArea = scrollAreaRef.current;
                  if (scrollArea && markers.length > 0) {
                    const marker = markers[0];
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
                clearInterval(countdownIntervalRef.current);
                clearTimeout(timeoutRef.current);
                setShowProgress(false);
              }
            }}
          >
            {isScrolling ? "停止" : "开始"}
          </button>
          <button className="downButton" onClick={() => scrollToMarker('down')}></button>
        </div>

        {showProgress && (
          <CircularProgress
            pauseDuration={pauseDuration}
            remainingTime={remainingTime}
          />
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
