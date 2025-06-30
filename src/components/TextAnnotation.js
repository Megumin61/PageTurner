import React, { useState } from 'react';
import DraggableElement from './DraggableElement';

const TextAnnotation = ({
  id,
  position,
  text,
  onPositionChange,
  onTextChange,
  onDelete
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
  
  // 切换编辑模式
  const handleToggleEdit = (e) => {
    e.stopPropagation(); // 防止触发拖动
    setIsEditing(!isEditing);
  };
  
  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation(); // 防止触发拖动
    onDelete(id);
  };
  
  // 处理按键事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 防止换行
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
      className={`text-annotation ${isEditing ? 'editing' : ''}`}
      disabled={isEditing} // 编辑时禁用拖动
    >
      {/* 文本显示视图 */}
      {!isEditing && (
        <>
          <div 
            className="text-annotation-view"
            onClick={handleToggleEdit}
          >
            {text}
          </div>
          <button 
            className="annotation-delete-btn"
            onClick={handleDelete}
          >
            ×
          </button>
        </>
      )}
      
      {/* 文本编辑气泡 */}
      {isEditing && (
        <div className="annotation-bubble">
          <button 
            className="annotation-bubble-close-btn"
            onClick={() => {
              setIsEditing(false);
              setCurrentText(text); // 取消时恢复原始文本
            }}
          >
            ×
          </button>
          <textarea
            className="annotation-textarea"
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="输入文字..."
            autoFocus
            style={{ height: '60px' }}
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

export default TextAnnotation; 