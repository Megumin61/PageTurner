import React, { useState, useEffect } from 'react';
import AnnotationMarker from './AnnotationMarker';
import TextAnnotation from './TextAnnotation';

// ΨһID���ɺ���
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const AnnotationLayer = ({ 
  selectedTool, 
  containerRef,
  isAnnotationMode 
}) => {
  // �洢���б��
  const [markers, setMarkers] = useState([]);
  
  // ��������ӱ��
  const handleContainerClick = (e) => {
    // ������ڱ�עģʽ��δѡ�񹤾ߣ�������
    if (!isAnnotationMode || !selectedTool) return;
    
    // ��ȡ���λ�����������������
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // �����±��
    const newMarker = {
      id: generateId(),
      position: { x, y },
      type: selectedTool === 'text' ? 'text' : 'sticker',
      text: '',
      src: selectedTool === 'text' ? null : selectedTool
    };
    
    // ��ӵ�����б�
    setMarkers(prev => [...prev, newMarker]);
  };
  
  // ���±��λ��
  const handleMarkerPositionChange = (id, newPosition) => {
    setMarkers(prev => 
      prev.map(marker => 
        marker.id === id 
          ? { ...marker, position: newPosition } 
          : marker
      )
    );
  };
  
  // ���±���ı�
  const handleMarkerTextChange = (id, newText) => {
    setMarkers(prev => 
      prev.map(marker => 
        marker.id === id 
          ? { ...marker, text: newText } 
          : marker
      )
    );
  };
  
  // ɾ�����
  const handleMarkerDelete = (id) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };
  
  // ����������¼�
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