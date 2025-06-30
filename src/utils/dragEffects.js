/**
 * Ϊ�϶�Ԫ����Ӷ���Ч��
 * ������������϶������ж�̬����Ԫ�صı��κ���תЧ��
 * @param {HTMLElement} element - ���϶���DOMԪ��
 * @param {Object} event - ���/�����¼�����
 * @param {Object} initialState - ��ʼ�϶�״̬��Ϣ
 * @param {number} initialState.clientX - ��ʼ�϶�ʱ��X����
 * @param {number} initialState.clientY - ��ʼ�϶�ʱ��Y����
 */
export const applyDragAnimation = (element, event, initialState) => {
  if (!element) return;
  
  // ��������ƶ�����
  const deltaX = event.clientX - initialState.clientX;
  const deltaY = event.clientY - initialState.clientY;
  
  // �����ƶ��ٶȺͷ��������ת�Ƕ�
  // ʹ�÷����Ժ���ʹ�ö���������Ȼ
  const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const speed = Math.min(moveDistance / 30, 4); // ��������ٶ�Ӱ��
  
  // �����ƶ����������ת����
  const rotateDirection = deltaX > 0 ? 1 : -1;
  const rotateAngle = rotateDirection * Math.min(speed * 3, 12); // �����ת�Ƕ�Ϊ12��
  
  // ����Ч�����ٶȱ仯
  const scaleAmount = 1 + Math.min(speed * 0.05, 0.2); // ���Ŵ�1.2��
  
  // Ӧ�ñ任
  element.style.transform = `scale(${scaleAmount}) rotate(${rotateAngle}deg)`;
  
  // �����ٶȵ�����ӰЧ������ǿ�����
  const shadowBlur = Math.min(5 + speed * 2, 15);
  const shadowDistance = Math.min(3 + speed, 8);
  element.style.boxShadow = `0 ${shadowDistance}px ${shadowBlur}px rgba(0,0,0,${0.1 + speed * 0.05})`;
  
  // ��¼��һ�ε��ٶȣ���������ʵ���϶�����ʱ�Ĺ���Ч��
  element.dataset.lastSpeed = speed;
  element.dataset.lastRotate = rotateAngle;
};

/**
 * �϶�����ʱ�Ļָ�����
 * @param {HTMLElement} element - ���϶���DOMԪ��
 */
export const resetDragAnimation = (element) => {
  if (!element) return;
  
  // ��ȡ֮ǰ���ٶ���Ϣ���ڴ�������Ч��
  const lastSpeed = parseFloat(element.dataset.lastSpeed || 0);
  
  // Ӧ�ù���Ч��
  element.style.transition = `transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease`;
  
  // ���ñ任
  element.style.transform = '';
  element.style.boxShadow = '';
  
  // �������
  setTimeout(() => {
    element.style.transition = '';
  }, 300);
}; 