import React, { useState, useEffect } from 'react';
import AnnotationMarker from './AnnotationMarker';
import TextAnnotation from './TextAnnotation';

// 唯一ID生成函数
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const AnnotationLayer = ({ 
  selectedTool, 
  containerRef,
  isAnnotationMode 
}) => {
  // 存储所有标记
  const [markers, setMarkers] = useState([]);
  
  // 处理点击添加标记
  const handleContainerClick = (e) => {
    // 如果不在标注模式或未选择工具，不处理
    if (!isAnnotationMode || !selectedTool) return;
    
    // 获取点击位置相对于容器的坐标
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 创建新标记
    const newMarker = {
      id: generateId(),
      position: { x, y },
      type: selectedTool === 'text' ? 'text' : 'sticker',
      text: '',
      src: selectedTool === 'text' ? null : selectedTool
    };
    
    // 添加到标记列表
    setMarkers(prev => [...prev, newMarker]);
  };
  
  // 更新标记位置
  const handleMarkerPositionChange = (id, newPosition) => {
    setMarkers(prev => 
      prev.map(marker => 
        marker.id === id 
          ? { ...marker, position: newPosition } 
          : marker
      )
    );
  };
  
  // 更新标记文本
  const handleMarkerTextChange = (id, newText) => {
    setMarkers(prev => 
      prev.map(marker => 
        marker.id === id 
          ? { ...marker, text: newText } 
          : marker
      )
    );
  };
  
  // 删除标记
  const handleMarkerDelete = (id) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };
  
  // 绑定容器点击事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('click', handleContainerClick);
    
    return () => {
      container.removeEventListener('click', handleContainerClick);
    };
  }, [containerRef, isAnnotationMode, selectedTool]);
  
  return (
    <div className="annotation-layer">
      {markers.map(marker => (
        marker.type === 'text' ? (
          <TextAnnotation
            key={marker.id}
            id={marker.id}
            position={marker.position}
            text={marker.text}
            onPositionChange={handleMarkerPositionChange}
            onTextChange={handleMarkerTextChange}
            onDelete={handleMarkerDelete}
          />
        ) : (
          <AnnotationMarker
            key={marker.id}
            id={marker.id}
            position={marker.position}
            stickerSrc={marker.src}
            text={marker.text}
            onPositionChange={handleMarkerPositionChange}
            onTextChange={handleMarkerTextChange}
            onDelete={handleMarkerDelete}
          />
        )
      ))}
    </div>
  );
};

export default AnnotationLayer; 