<template>
  <div id="app">
    <div style="height: 800px; width: 1200px; border: 1px solid red; position: relative;margin: 0 auto">
      <vue-draggable-resizable
        @mouseenter.native="onMouseEnter" @mouseleave.native="onMouseLeave"
        @deactivated="onDeactivated" @activated="onActivated"
        @dragstop="getTwoElPosition"
        :w="200" :h="200" :parent="true" :debug="false" :min-width="200" :min-height="200"
        :snap="true" :snapTolerance="1" @refLineParams="getRefLineParams" class="test1">
      </vue-draggable-resizable>
      <vue-draggable-resizable
        @mouseenter.native="onMouseEnter" @mouseleave.native="onMouseLeave"
        @deactivated="onDeactivated" @activated="onActivated"
        @dragstop="getTwoElPosition"
        :w="200" :h="200" :parent="true"
        :x="210" :debug="false" :min-width="200" :min-height="200" :snap="true" :snapTolerance="1"
        @refLineParams="getRefLineParams" class="test2">
      </vue-draggable-resizable>
      <vue-draggable-resizable
        @mouseenter.native="onMouseEnter" @mouseleave.native="onMouseLeave"
        @deactivated="onDeactivated" @activated="onActivated"
        @dragstop="getTwoElPosition"
        :w="200" :h="200" :parent="true" :x="420" :debug="false"
        :min-width="200" :min-height="200" :snap="true" :snapTolerance="1" @refLineParams="getRefLineParams"
        class="test3">
      </vue-draggable-resizable>
      <!--辅助线-->
      <span class="ref-line v-line" v-for="item in vLine" :key="item.id" v-show="item.display"
        :style="{ left: item.position, top: item.origin, height: item.lineLength}" />
      <span class="ref-line h-line" v-for="item in hLine" :key="item.id" v-show="item.display"
        :style="{ top: item.position, left: item.origin, width: item.lineLength}" />
      <span class="" />
      <!--辅助线END-->
      <!-- 距离辅助线 -->
      <span class="ref-line v-line text-center" v-for="item in ruleLines.ruleVLine" :key="item.id"
        :style="{ left: item.left + 'px', top: item.top + 'px', height: item.lineLength + 'px'}" >{{item.lineLength}}</span>
      <span class="ref-line h-line text-center" v-for="item in ruleLines.ruleHLine" :key="item.id"
        :style="{ top: item.top + 'px', left: item.left + 'px', width: item.lineLength + 'px'}" >{{item.lineLength}}</span>
      <span class="" />
      <!-- 虚线 -->
      <span style="border-left: 1px dashed blue;width: 0;background-color: transparent;" class="ref-line v-line text-center" v-for="item in ruleLines.dashedVLine" :key="item.id"
        :style="{ left: item.left + 'px', top: item.top + 'px', height: item.lineLength + 'px'}" />
      <span style="border-top: 1px dashed blue;height: 0;background-color: transparent;" class="ref-line h-line text-center" v-for="item in ruleLines.dashedHLine" :key="item.id"
        :style="{ top: item.top + 'px', left: item.left + 'px', width: item.lineLength + 'px'}" />
    </div>
  </div>
</template>

<script>
import { h } from 'vue'
import VueDraggableResizable from './components/vue-draggable-resizable'
import './components/vue-draggable-resizable.css'
import { genLinesForNoAxisOverlapping, genLinesForXAxisProjectionOverlapping, genLinesForYAxisProjectionOverlapping } from './generate-lines'
const getElPosition = (theSrcEl) => {
  const leftTop = theSrcEl.style.transform ? (theSrcEl.style.transform.match(/^translate\((\d+)px,\s(\d+)px\)$/).slice(1) || [0, 0]) : [theSrcEl.offsetLeft, theSrcEl.offsetTop]
  const theSrcElPosition = {
    offsetHeight: theSrcEl.offsetHeight,
    offsetWidth: theSrcEl.offsetWidth,
    offsetLeft: parseInt(leftTop[0]),
    offsetTop: parseInt(leftTop[1])
  }
  return theSrcElPosition
}
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
const cases = {
  noAxisOverlapping: 'noAxisOverlapping',
  XAxisProjectionOverlapping: 'XAxisOverlapping',
  YAxisProjectionOverlapping: 'YAxisOverlapping',
  elementOverlapping: 'elementOverlapping'
}
export default {
  name: 'app',
  components: {
    VueDraggableResizable
  },
  data () {
    return {
      vLine: [],
      hLine: [],
      activeEl: null,
      targetEl: null,
      ruleVLine: [],
      ruleHLine: [],
      activeElPosition: null,
      targetElPosition: null
    }
  },
  computed: {
    currentOverlappingCase () {
      // 计算距离，三种情况
      // 1. 两个元素在x，y轴上的投影没有重叠，只计算靠近的两条边的距离
      // 2. 两个元素在X或y轴的投影上有重叠，但是两元素本身没有重叠，
      // 若相对x有投影，要计算两个元素的垂直边的距离，若相对y有投影，要计算两元素水平边的距离
      // 3. 两元素本身有重叠，计算两元素四个边各自相对应的距离
      let theOverlappingCase = cases.noAxisOverlapping
      const theRelatedEl = this.targetElPosition
      const activeEl = this.activeElPosition
      if (!theRelatedEl || !activeEl) {
        return null
      }
      // 判断情况
      // X轴投影重叠
      if (
        computeOverlappingSeg(
          [theRelatedEl.offsetLeft, theRelatedEl.offsetLeft + theRelatedEl.offsetWidth],
          [activeEl.offsetLeft, activeEl.offsetLeft + activeEl.offsetWidth]
        ) !== null
      ) {
        theOverlappingCase = cases.XAxisProjectionOverlapping
      }
      // Y轴投影重叠
      if (
        computeOverlappingSeg(
          [theRelatedEl.offsetTop, theRelatedEl.offsetTop + theRelatedEl.offsetHeight],
          [activeEl.offsetTop, activeEl.offsetTop + activeEl.offsetHeight]
        ) !== null
      ) {
        if (theOverlappingCase === cases.noAxisOverlapping) {
          theOverlappingCase = cases.YAxisProjectionOverlapping
        } else {
          theOverlappingCase = cases.elementOverlapping
        }
      }
      return theOverlappingCase
    },
    ruleLines () {
      const theRelatedEl = this.targetElPosition
      const activeEl = this.activeElPosition
      const lines = {
        ruleVLine: [],
        ruleHLine: [],
        dashedVLine: [],
        dashedHLine: []
      }
      if (theRelatedEl === activeEl) {
        return lines
      }
      // cases.noAxisOverlapping
      // 选中active的元素的top-hover元素的bottom，right-left，left-right，bottom-top
      if (this.currentOverlappingCase === cases.noAxisOverlapping) {
        return genLinesForNoAxisOverlapping(activeEl, theRelatedEl)
      }
      if (this.currentOverlappingCase === cases.XAxisProjectionOverlapping) {
        return genLinesForXAxisProjectionOverlapping(activeEl, theRelatedEl)
      }
      if (this.currentOverlappingCase === cases.YAxisProjectionOverlapping) {
        return genLinesForYAxisProjectionOverlapping(activeEl, theRelatedEl)
      }
      return lines
    }
  },
  methods: {
    onMouseEnter (e) {
      this.targetEl = e.target
      this.targetElPosition = getElPosition(e.target)
    },
    onMouseLeave (e) {
      this.targetEl = null
      this.targetElPosition = null
    },
    onDeactivated () {
      this.activeEl = null
      this.activeElPosition = null
    },
    onActivated (activeEl) {
      this.activeEl = activeEl.$el
      this.activeElPosition = getElPosition(activeEl.$el)
    },
    getTwoElPosition () {
      if (!this.targetEl) {
        this.targetElPosition = null
      } else {
        this.targetElPosition = getElPosition(this.targetEl)
      }
      if (!this.activeEl) {
        this.activeElPosition = null
      } else {
        this.activeElPosition = getElPosition(this.activeEl)
      }
    },
    // 辅助线回调事件
    getRefLineParams (params) {
      const { vLine, hLine } = params
      let id = 0
      this.vLine = vLine.map(item => {
        item['id'] = ++id
        return item
      })
      this.hLine = hLine.map(item => {
        item['id'] = ++id
        return item
      })
    }
  }
}
</script>

<style>
.test1 {
  background-color: rgb(239, 154, 154);
}

.test2 {
  background-color: rgb(129, 212, 250);
}

.test3 {
  background-color: rgb(174, 213, 129);
}
</style>
