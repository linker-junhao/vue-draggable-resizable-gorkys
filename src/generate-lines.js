/**
 * 计算两条线段重叠的部分，有重叠返回重叠线段，没有重叠返回null
 * @param {[number, number]} seg1
 * @param {[number, number]} seg2
 * @return {[number, number]|null}
 */
const computeOverlappingSeg = (seg1, seg2) => {
  if (seg1[0] >= seg2[1] || seg1[1] <= seg2[0]) {
    return null
  }
  return [...seg1, ...seg2].sort((l, r) => l - r).slice(1, 3)
}

/**
 * 创建ElPosition
 * @class
 * @return {TheElPosition}
 */
function TheElPosition ({
  offsetTop,
  offsetLeft,
  offsetWidth,
  offsetHeight
}) {
  this.offsetTop = offsetTop
  this.offsetLeft = offsetLeft
  this.offsetWidth = offsetWidth
  this.offsetHeight = offsetHeight
  return this
}

/**
 *
 * @class
 * @param {{left: Number, top: Number, lineLength: Number}} params
 * @return {Line}
 */
function Line ({ left, top, lineLength }) {
  this.left = left
  this.top = top
  this.lineLength = lineLength
  return this
}

/**
 * 创建lines
 *
 * @Class
 */
function LinesOfTwoRelatedEl () {
  /**  @type {Line[]} */
  this.ruleVLine = []
  /**  @type {Line[]} */
  this.ruleHLine = []
  /**  @type {Line[]} */
  this.dashedVLine = []
  /**  @type {Line[]} */
  this.dashedHLine = []

  return this
}

/**
 * 无投影重叠的计算
 *
 * @param {TheElPosition} activeEl
 * @param {TheElPosition} theRelatedEl
 * @return {LinesOfTwoRelatedEl}
 */
const genLinesForNoAxisOverlapping = (activeEl, theRelatedEl) => {
  const lines = new LinesOfTwoRelatedEl()
  const ruleValue = {
    top: activeEl.offsetTop - (theRelatedEl.offsetTop + theRelatedEl.offsetHeight),
    bottom: activeEl.offsetTop + activeEl.offsetHeight - theRelatedEl.offsetTop,
    left: activeEl.offsetLeft - (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth),
    right: activeEl.offsetLeft + activeEl.offsetWidth - theRelatedEl.offsetLeft
  }
  // 找绝对距离最短的水平与垂直计算结果
  const horizontalLineFromLeftSide = Math.abs(ruleValue.left) < Math.abs(ruleValue.right)
  const verticalLineFromTopSide = Math.abs(ruleValue.top) < Math.abs(ruleValue.bottom)
  if (horizontalLineFromLeftSide) {
    // 从左侧边出发做辅助线
    lines.ruleHLine = [new Line({
      left: activeEl.offsetLeft - Math.abs(ruleValue.left),
      top: activeEl.offsetTop + activeEl.offsetHeight / 2,
      lineLength: Math.abs(ruleValue.left)
    })]
  } else {
    // 从右侧边出发做辅助线
    lines.ruleHLine = [new Line({
      left: activeEl.offsetLeft + activeEl.offsetWidth,
      top: activeEl.offsetTop + activeEl.offsetHeight / 2,
      lineLength: Math.abs(ruleValue.right)
    })]
  }
  if (verticalLineFromTopSide) {
    // 从上边出发
    lines.ruleVLine = [new Line({
      top: activeEl.offsetTop - Math.abs(ruleValue.top),
      left: activeEl.offsetLeft + activeEl.offsetWidth / 2,
      lineLength: Math.abs(ruleValue.top)
    })]
  } else {
    // 从下边
    lines.ruleVLine = [new Line({
      top: activeEl.offsetTop + activeEl.offsetHeight,
      left: activeEl.offsetLeft + activeEl.offsetWidth / 2,
      lineLength: Math.abs(ruleValue.bottom)
    })]
  }
  lines.ruleHLine.forEach((hl) => {
    lines.dashedVLine = [new Line({
      left: hl.left + (horizontalLineFromLeftSide ? 0 : hl.lineLength),
      top: hl.top - (verticalLineFromTopSide ? hl.top - (theRelatedEl.offsetTop + theRelatedEl.offsetHeight) : 0),
      lineLength: Math.abs(
        verticalLineFromTopSide ? hl.top - (theRelatedEl.offsetTop + theRelatedEl.offsetHeight) : hl.top - theRelatedEl.offsetTop
      )
    })]
  })
  lines.ruleVLine.forEach((vl) => {
    lines.dashedHLine = [new Line({
      left: vl.left - (horizontalLineFromLeftSide ? vl.left - (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth) : 0),
      top: vl.top + (verticalLineFromTopSide ? 0 : vl.lineLength),
      lineLength: Math.abs(
        horizontalLineFromLeftSide ? vl.left - (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth) : vl.left - theRelatedEl.offsetLeft
      )
    })]
  })
  return lines
}

/**
 * x投影重叠的计算
 *
 * @param {TheElPosition} activeEl
 * @param {TheElPosition} theRelatedEl
 * @return {LinesOfTwoRelatedEl}
 */
const genLinesForXAxisProjectionOverlapping = (activeEl, theRelatedEl) => {
  const lines = new LinesOfTwoRelatedEl()
  const overlappingSegment = computeOverlappingSeg([
    activeEl.offsetLeft, activeEl.offsetLeft + activeEl.offsetWidth
  ], [
    theRelatedEl.offsetLeft, theRelatedEl.offsetLeft + theRelatedEl.offsetWidth
  ])
  const ruleValue = {
    top: activeEl.offsetTop - (theRelatedEl.offsetTop + theRelatedEl.offsetHeight),
    bottom: activeEl.offsetTop + activeEl.offsetHeight - theRelatedEl.offsetTop,
    left: activeEl.offsetLeft - theRelatedEl.offsetLeft,
    right: activeEl.offsetLeft + activeEl.offsetWidth - (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth)
  }
  const isVerticalLineFromTop = Math.abs(ruleValue.top) < Math.abs(ruleValue.bottom)
  // 重叠部分的距离线
  lines.ruleVLine = [new Line({
    left: overlappingSegment.reduce((all, num) => all + num, 0) / 2,
    top: isVerticalLineFromTop ? activeEl.offsetTop - Math.abs(ruleValue.top) : activeEl.offsetTop + activeEl.offsetHeight,
    lineLength: Math.abs(isVerticalLineFromTop ? ruleValue.top : ruleValue.bottom)
  })]
  if (ruleValue.left !== 0) {
    lines.ruleHLine.push(new Line({
      left: ruleValue.left > 0 ? activeEl.offsetLeft - ruleValue.left : theRelatedEl.offsetLeft + ruleValue.left,
      top: ruleValue.left > 0 ? (activeEl.offsetTop + activeEl.offsetHeight / 2) : (theRelatedEl.offsetTop + theRelatedEl.offsetHeight / 2),
      lineLength: Math.abs(ruleValue.left)
    }))
  }
  if (ruleValue.right !== 0) {
    lines.ruleHLine.push(new Line({
      left: ruleValue.right < 0 ? activeEl.offsetLeft + activeEl.offsetWidth : theRelatedEl.offsetLeft + theRelatedEl.offsetWidth,
      top: ruleValue.right < 0 ? (activeEl.offsetTop + activeEl.offsetHeight / 2) : (theRelatedEl.offsetTop + theRelatedEl.offsetHeight / 2),
      lineLength: Math.abs(ruleValue.right)
    }))
  }
  lines.ruleHLine.forEach((ruleLine, lineIndex) => {
    const lineName = ['left', 'right'][lineIndex]
    if (lineName === 'left') {
      const lineLength = Math.abs(isVerticalLineFromTop ? ruleValue.top : ruleValue.bottom) + (
        (ruleValue.left > 0 ? activeEl.offsetHeight : theRelatedEl.offsetHeight) / 2
      )
      lines.dashedVLine.push(new Line({
        left: ruleLine.left,
        top: ruleValue.left > 0 ? (
          isVerticalLineFromTop ? ruleLine.top - lineLength : ruleLine.top
        ) : (
          isVerticalLineFromTop ? ruleLine.top : ruleLine.top - lineLength
        ),
        lineLength
      }))
    }
    if (lineName === 'right') {
      const lineLength = Math.abs(isVerticalLineFromTop ? ruleValue.top : ruleValue.bottom) + (
        (ruleValue.right > 0 ? theRelatedEl.offsetHeight : activeEl.offsetHeight) / 2
      )
      lines.dashedVLine.push(new Line({
        left: ruleLine.left + ruleLine.lineLength,
        top: ruleValue.right > 0 ? (
          isVerticalLineFromTop ? ruleLine.top : ruleLine.top - lineLength
        ) : (
          isVerticalLineFromTop ? ruleLine.top - lineLength : ruleLine.top
        ),
        lineLength
      }))
    }
  })
  return lines
}

/**
 * y投影重叠的计算
 *
 * @param {TheElPosition} activeEl
 * @param {TheElPosition} theRelatedEl
 * @return {LinesOfTwoRelatedEl}
 */
const genLinesForYAxisProjectionOverlapping = (activeEl, theRelatedEl) => {
  const lines = new LinesOfTwoRelatedEl()
  const overlappingSegment = computeOverlappingSeg([
    activeEl.offsetTop, activeEl.offsetTop + activeEl.offsetHeight
  ], [
    theRelatedEl.offsetTop, theRelatedEl.offsetTop + theRelatedEl.offsetHeight
  ])
  const ruleValue = {
    top: activeEl.offsetTop - theRelatedEl.offsetTop,
    bottom: activeEl.offsetTop + activeEl.offsetHeight - (theRelatedEl.offsetTop + theRelatedEl.offsetHeight),
    left: activeEl.offsetLeft - (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth),
    right: activeEl.offsetLeft + activeEl.offsetWidth - theRelatedEl.offsetLeft
  }
  const isHorizontalLineFromLeft = Math.abs(ruleValue.left) < Math.abs(ruleValue.right)
  // 重叠部分的距离线
  if (Math.abs(isHorizontalLineFromLeft ? ruleValue.left : ruleValue.right) !== 0) {
    lines.ruleHLine = [{
      top: overlappingSegment.reduce((all, num) => all + num, 0) / 2,
      left: isHorizontalLineFromLeft ? activeEl.offsetLeft - Math.abs(ruleValue.left) : activeEl.offsetLeft + activeEl.offsetWidth,
      lineLength: Math.abs(isHorizontalLineFromLeft ? ruleValue.left : ruleValue.right)
    }]
  }
  if (ruleValue.top !== 0) {
    lines.ruleVLine.push({
      top: ruleValue.top > 0 ? activeEl.offsetTop - ruleValue.top : theRelatedEl.offsetTop + ruleValue.top,
      left: ruleValue.top > 0 ? (activeEl.offsetLeft + activeEl.offsetWidth / 2) : (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth / 2),
      lineLength: Math.abs(ruleValue.top)
    })
  }
  if (ruleValue.bottom !== 0) {
    lines.ruleVLine.push({
      top: ruleValue.bottom < 0 ? activeEl.offsetTop + activeEl.offsetHeight : theRelatedEl.offsetTop + theRelatedEl.offsetHeight,
      left: ruleValue.bottom < 0 ? (activeEl.offsetLeft + activeEl.offsetWidth / 2) : (theRelatedEl.offsetLeft + theRelatedEl.offsetWidth / 2),
      lineLength: Math.abs(ruleValue.bottom)
    })
  }
  lines.ruleVLine.forEach((ruleLine, lineIndex) => {
    const lineName = ['top', 'bottom'][lineIndex]
    if (lineName === 'top') {
      const lineLength = Math.abs(isHorizontalLineFromLeft ? ruleValue.left : ruleValue.right) + (
        (ruleValue.top > 0 ? activeEl.offsetWidth : theRelatedEl.offsetWidth) / 2
      )
      lines.dashedHLine.push({
        top: ruleLine.top,
        left: ruleValue.top > 0 ? (
          isHorizontalLineFromLeft ? ruleLine.left - lineLength : ruleLine.left
        ) : (
          isHorizontalLineFromLeft ? ruleLine.left : ruleLine.left - lineLength
        ),
        lineLength
      })
    }
    if (lineName === 'bottom') {
      const lineLength = Math.abs(isHorizontalLineFromLeft ? ruleValue.left : ruleValue.right) + (
        (ruleValue.bottom > 0 ? theRelatedEl.offsetWidth : activeEl.offsetWidth) / 2
      )
      lines.dashedHLine.push({
        top: ruleLine.top + ruleLine.lineLength,
        left: ruleValue.bottom > 0 ? (
          isHorizontalLineFromLeft ? ruleLine.left : ruleLine.left - lineLength
        ) : (
          isHorizontalLineFromLeft ? ruleLine.left - lineLength : ruleLine.left
        ),
        lineLength
      })
    }
  })
  return lines
}

function ActiveElMapLinesManager () {
  this.cachedActiveEls = new Map()
}

ActiveElMapLinesManager.prototype.computeLines = function () {
}

ActiveElMapLinesManager.prototype.getLines = function (activeEl, theRelatedEl) {
}

export {
  TheElPosition,
  genLinesForNoAxisOverlapping,
  genLinesForXAxisProjectionOverlapping,
  genLinesForYAxisProjectionOverlapping
}
