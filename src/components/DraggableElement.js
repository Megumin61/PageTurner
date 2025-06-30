import React, { useState, useRef, useEffect } from 'react';
import { applyDragAnimation, resetDragAnimation } from '../utils/dragEffects';
import './DraggableElement.css';

/**
 * 可拖拽元素组件
 * 为子元素添加拖拽功能和动画效果
 */
const DraggableElement = ({ 
  children, 
  position, 
  onPositionChange,
  className = '',
  style = {},
  dragHandleClass = null, // 可选的拖动把手CSS类名
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

  // 处理拖动开始
  const handleDragStart = (e) => {
    if (disabled) return;
    
    // 确认如果有dragHandleClass，只有点击该元素才可拖动
    if (dragHandleClass) {
      let targetElement = e.target;
      let isHandle = false;
      
      // 向上查找父元素，直到找到拖动把手或达到当前组件元素
      while (targetElement && targetElement !== elementRef.current) {
        if (targetElement.classList.contains(dragHandleClass)) {
          isHandle = true;
          break;
        }
        targetElement = targetElement.parentElement;
      }
      
      // 如果点击的不是把手元素，不启动拖动
      if (!isHandle) return;
    }
    
    // 防止文本选择和浏览器默认拖动行为
    e.preventDefault();
    
    // 记录初始位置
    initialPosRef.current = { 
      x: position.x, 
      y: position.y 
    };
    
    // 记录鼠标相对于元素的偏移
    const rect = elementRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // 存储拖动状态信息
    dragStateRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: offsetX,
      offsetY: offsetY
    };
    
    // 标记为正在拖动
    setIsDragging(true);
    
    // 添加全局事件监听
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    // 添加初始动画效果
    applyDragAnimation(elementRef.current, e, dragStateRef.current);
  };
  
  // 处理拖动过程
  const handleDrag = (e) => {
    if (!isDragging) return;
    
    // 计算新位置
    const newX = e.clientX - dragStateRef.current.offsetX;
    const newY = e.clientY - dragStateRef.current.offsetY;
    
    // 更新位置
    onPositionChange({ x: newX, y: newY });
    
    // 应用动画效果
    applyDragAnimation(elementRef.current, e, dragStateRef.current);
  };
  
  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // 重置动画效果
    resetDragAnimation(elementRef.current);
  };
  
  // 组件卸载时确保清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);
  
  // 合并样式
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