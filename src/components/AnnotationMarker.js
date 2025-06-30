import React, { useState } from 'react';
import DraggableElement from './DraggableElement';

const AnnotationMarker = ({
  id,
  position,
  stickerSrc,
  text = '',
  onPositionChange,
  onDelete,
  onTextChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  
  // 处理文本变化
  const handleTextChange = (e) => {
    setCurrentText(e.target.value);
  };
  
  // 保存文本变更
  const handleSaveText = () => {
    onTextChange(id, currentText);
    setIsEditing(false);
  };
  
  // 打开编辑模式
  const handleEditClick = (e) => {
    e.stopPropagation(); // 防止触发拖动
    setIsEditing(true);
  };
  
  // 关闭编辑模式
  const handleCloseEdit = () => {
    setIsEditing(false);
  };
  
  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation(); // 防止触发拖动
    onDelete(id);
  };
  
  // 处理按键事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveText();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentText(text); // 恢复原始文本
    }
  };

  return (
    <DraggableElement
      position={position}
      onPositionChange={(newPos) => onPositionChange(id, newPos)}
      className={`annotation-marker ${isEditing ? 'editing' : ''}`}
      disabled={isEditing} // 编辑时禁用拖动
    >
      <img src={stickerSrc} alt="Sticker" />
      
      {/* 删除按钮 */}
      {!isEditing && (
        <button 
          className="annotation-delete-btn"
          onClick={handleDelete}
        >
          ×
        </button>
      )}
      
      {/* 文本显示 */}
      {!isEditing && text && (
        <div className="annotation-text-view" onClick={handleEditClick}>
          {text}
        </div>
      )}
      
      {/* 文本编辑气泡 */}
      {isEditing && (
        <div className="annotation-bubble">
          <button 
            className="annotation-bubble-close-btn"
            onClick={handleCloseEdit}
          >
            ×
          </button>
          <textarea
            className="annotation-textarea"
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="添加备注..."
            autoFocus
          />
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <button 
              style={{
                padding: '4px 8px',
                background: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={handleSaveText}
            >
              保存
            </button>
          </div>
        </div>
      )}
    </DraggableElement>
  );
};

export default AnnotationMarker; 