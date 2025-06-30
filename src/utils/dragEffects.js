/**
 * 为拖动元素添加动画效果
 * 这个函数会在拖动过程中动态调整元素的变形和旋转效果
 * @param {HTMLElement} element - 被拖动的DOM元素
 * @param {Object} event - 鼠标/触摸事件对象
 * @param {Object} initialState - 初始拖动状态信息
 * @param {number} initialState.clientX - 开始拖动时的X坐标
 * @param {number} initialState.clientY - 开始拖动时的Y坐标
 */
export const applyDragAnimation = (element, event, initialState) => {
  if (!element) return;
  
  // 计算鼠标移动距离
  const deltaX = event.clientX - initialState.clientX;
  const deltaY = event.clientY - initialState.clientY;
  
  // 根据移动速度和方向计算旋转角度
  // 使用非线性函数使得动画更加自然
  const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const speed = Math.min(moveDistance / 30, 4); // 限制最大速度影响
  
  // 根据移动方向调整旋转方向
  const rotateDirection = deltaX > 0 ? 1 : -1;
  const rotateAngle = rotateDirection * Math.min(speed * 3, 12); // 最大旋转角度为12度
  
  // 缩放效果随速度变化
  const scaleAmount = 1 + Math.min(speed * 0.05, 0.2); // 最大放大到1.2倍
  
  // 应用变换
  element.style.transform = `scale(${scaleAmount}) rotate(${rotateAngle}deg)`;
  
  // 根据速度调整阴影效果，增强立体感
  const shadowBlur = Math.min(5 + speed * 2, 15);
  const shadowDistance = Math.min(3 + speed, 8);
  element.style.boxShadow = `0 ${shadowDistance}px ${shadowBlur}px rgba(0,0,0,${0.1 + speed * 0.05})`;
  
  // 记录上一次的速度，可以用于实现拖动结束时的惯性效果
  element.dataset.lastSpeed = speed;
  element.dataset.lastRotate = rotateAngle;
};

/**
 * 拖动结束时的恢复动画
 * @param {HTMLElement} element - 被拖动的DOM元素
 */
export const resetDragAnimation = (element) => {
  if (!element) return;
  
  // 读取之前的速度信息用于创建惯性效果
  const lastSpeed = parseFloat(element.dataset.lastSpeed || 0);
  
  // 应用过渡效果
  element.style.transition = `transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease`;
  
  // 重置变换
  element.style.transform = '';
  element.style.boxShadow = '';
  
  // 清除数据
  setTimeout(() => {
    element.style.transition = '';
  }, 300);
}; 