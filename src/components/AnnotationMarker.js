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
  
  // �����ı��仯
  const handleTextChange = (e) => {
    setCurrentText(e.target.value);
  };
  
  // �����ı����
  const handleSaveText = () => {
    onTextChange(id, currentText);
    setIsEditing(false);
  };
  
  // �򿪱༭ģʽ
  const handleEditClick = (e) => {
    e.stopPropagation(); // ��ֹ�����϶�
    setIsEditing(true);
  };
  
  // �رձ༭ģʽ
  const handleCloseEdit = () => {
    setIsEditing(false);
  };
  
  // ����ɾ��
  const handleDelete = (e) => {
    e.stopPropagation(); // ��ֹ�����϶�
    onDelete(id);
  };
  
  // �������¼�
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveText();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentText(text); // �ָ�ԭʼ�ı�
    }
  };

  return (
    <DraggableElement
      position={position}
      onPositionChange={(newPos) => onPositionChange(id, newPos)}
      className={`annotation-marker ${isEditing ? 'editing' : ''}`}
      disabled={isEditing} // �༭ʱ�����϶�
    >
      <img src={stickerSrc} alt="Sticker" />
      
      {/* ɾ����ť */}
      {!isEditing && (
        <button 
          className="annotation-delete-btn"
          onClick={handleDelete}
        >
          ��
        </button>
      )}
      
      {/* �ı���ʾ */}
      {!isEditing && text && (
        <div className="annotation-text-view" onClick={handleEditClick}>
          {text}
        </div>
      )}
      
      {/* �ı��༭���� */}
      {isEditing && (
        <div className="annotation-bubble">
          <button 
            className="annotation-bubble-close-btn"
            onClick={handleCloseEdit}
          >
            ��
          </button>
          <textarea
            className="annotation-textarea"
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="��ӱ�ע..."
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
              ����
            </button>
          </div>
        </div>
      )}
    </DraggableElement>
  );
};

export default AnnotationMarker; 