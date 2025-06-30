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
  
  // �����ı��仯
  const handleTextChange = (e) => {
    setCurrentText(e.target.value);
  };
  
  // �����ı����
  const handleSaveText = () => {
    onTextChange(id, currentText);
    setIsEditing(false);
  };
  
  // �л��༭ģʽ
  const handleToggleEdit = (e) => {
    e.stopPropagation(); // ��ֹ�����϶�
    setIsEditing(!isEditing);
  };
  
  // ����ɾ��
  const handleDelete = (e) => {
    e.stopPropagation(); // ��ֹ�����϶�
    onDelete(id);
  };
  
  // �������¼�
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // ��ֹ����
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
      className={`text-annotation ${isEditing ? 'editing' : ''}`}
      disabled={isEditing} // �༭ʱ�����϶�
    >
      {/* �ı���ʾ��ͼ */}
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
            ��
          </button>
        </>
      )}
      
      {/* �ı��༭���� */}
      {isEditing && (
        <div className="annotation-bubble">
          <button 
            className="annotation-bubble-close-btn"
            onClick={() => {
              setIsEditing(false);
              setCurrentText(text); // ȡ��ʱ�ָ�ԭʼ�ı�
            }}
          >
            ��
          </button>
          <textarea
            className="annotation-textarea"
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="��������..."
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
              ����
            </button>
          </div>
        </div>
      )}
    </DraggableElement>
  );
};

export default TextAnnotation; 