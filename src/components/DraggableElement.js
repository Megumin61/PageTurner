import React, { useState, useRef, useEffect } from 'react';
import { applyDragAnimation, resetDragAnimation } from '../utils/dragEffects';
import './DraggableElement.css';

/**
 * ����קԪ�����
 * Ϊ��Ԫ�������ק���ܺͶ���Ч��
 */
const DraggableElement = ({ 
  children, 
  position, 
  onPositionChange,
  className = '',
  style = {},
  dragHandleClass = null, // ��ѡ���϶�����CSS����
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);
  const initialPosRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef({
    clientX: 0,
    clientY: 0,
    offsetX: 0,
    offsetY: 0
  });

  // �����϶���ʼ
  const handleDragStart = (e) => {
    if (disabled) return;
    
    // ȷ�������dragHandleClass��ֻ�е����Ԫ�زſ��϶�
    if (dragHandleClass) {
      let targetElement = e.target;
      let isHandle = false;
      
      // ���ϲ��Ҹ�Ԫ�أ�ֱ���ҵ��϶����ֻ�ﵽ��ǰ���Ԫ��
      while (targetElement && targetElement !== elementRef.current) {
        if (targetElement.classList.contains(dragHandleClass)) {
          isHandle = true;
          break;
        }
        targetElement = targetElement.parentElement;
      }
      
      // �������Ĳ��ǰ���Ԫ�أ��������϶�
      if (!isHandle) return;
    }
    
    // ��ֹ�ı�ѡ��������Ĭ���϶���Ϊ
    e.preventDefault();
    
    // ��¼��ʼλ��
    initialPosRef.current = { 
      x: position.x, 
      y: position.y 
    };
    
    // ��¼��������Ԫ�ص�ƫ��
    const rect = elementRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // �洢�϶�״̬��Ϣ
    dragStateRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: offsetX,
      offsetY: offsetY
    };
    
    // ���Ϊ�����϶�
    setIsDragging(true);
    
    // ���ȫ���¼�����
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    // ��ӳ�ʼ����Ч��
    applyDragAnimation(elementRef.current, e, dragStateRef.current);
  };
  
  // �����϶�����
  const handleDrag = (e) => {
    if (!isDragging) return;
    
    // ������λ��
    const newX = e.clientX - dragStateRef.current.offsetX;
    const newY = e.clientY - dragStateRef.current.offsetY;
    
    // ����λ��
    onPositionChange({ x: newX, y: newY });
    
    // Ӧ�ö���Ч��
    applyDragAnimation(elementRef.current, e, dragStateRef.current);
  };
  
  // �����϶�����
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // �Ƴ�ȫ���¼�����
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // ���ö���Ч��
    resetDragAnimation(elementRef.current);
  };
  
  // ���ж��ʱȷ�������¼�����
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);
  
  // �ϲ���ʽ
  const combinedStyle = {
    ...style,
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none'
  };
  
  return (
    <div
      ref={elementRef}
      className={`draggable-element ${className} ${isDragging ? 'dragging' : ''}`}
      style={combinedStyle}
      onMouseDown={handleDragStart}
    >
      {children}
    </div>
  );
};

export default DraggableElement; 