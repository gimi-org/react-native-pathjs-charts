/*
Copyright 2016 Capital One Services, LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.

SPDX-Copyright: Copyright (c) Capital One Services, LLC
SPDX-License-Identifier: Apache-2.0
*/

import React,{Component} from 'react'
import {Text as ReactText}  from 'react-native'
import Svg,{ G, Path, Rect, Text, LinearGradient, Stop, Defs, Circle} from 'react-native-svg'
import { Colors, Options, cyclic, fontAdapt } from './util'
import Axis from './Axis'
import _ from 'lodash'

export default class LineChart extends Component {

  constructor(props, chartType) {
    super(props)
    this.chartType = chartType
  }

  getMaxAndMin(chart, key, scale, chartMin, chartMax) {
    let maxValue
    let minValue
    _.each(chart.curves, function (serie) {
      let values = _.map(serie.item, function (item) {
        return item[key]
      })

      let max = _.max(values)
      if (maxValue === undefined || max > maxValue) maxValue = max
      let min = _.min(values)
      if (minValue === undefined || min < minValue) minValue = min

      maxValue = chartMax > maxValue ? chartMax : maxValue
      minValue = chartMin < minValue ? chartMin : minValue
    })

    return {
      minValue: minValue,
      maxValue: maxValue,
      min: scale(minValue),
      max: scale(maxValue)
    }
  }

  color(i) {
    let color = this.props.options.color
    if (!_.isString(this.props.options.color)) color = color.color
    let pallete = this.props.pallete || Colors.mix(color || '#9ac7f7')
    return Colors.string(cyclic(pallete, i))
  }

  render() {
    const noDataMsg = this.props.noDataMessage || 'No data available'
    if (this.props.data === undefined) return (<ReactText>{noDataMsg}</ReactText>)

    let options = new Options(this.props)

    let accessor = function (key) {
      return function (x) {
        return x[key]
      }
    }

    let chart = this.chartType({
      data: this.props.data,
      xaccessor: accessor(this.props.xKey),
      yaccessor: accessor(this.props.yKey),
      width: options.chartWidth,
      height: options.chartHeight,
      closed: false,
      min: options.min,
      max: options.max
    })

    let chartArea = {
      x:this.getMaxAndMin(chart,this.props.xKey,chart.xscale),
      y:this.getMaxAndMin(chart,this.props.yKey,chart.yscale,options.min,options.max),
      margin:options.margin
    }

    let showAreas = typeof(this.props.options.showAreas) !== 'undefined' ? this.props.options.showAreas : true;
    let showAreaForData = typeof(this.props.showAreaForData) !== 'undefined' ? this.props.showAreaForData : false;
    let dottedLines = typeof(this.props.options.dottedLines) !== 'undefined' ? this.props.options.dottedLines : false;
    let strokeWidth = typeof(this.props.options.strokeWidth) !== 'undefined' ? this.props.options.strokeWidth : '1';
    let areaFade = typeof(this.props.areaFade) !== 'undefined' ? this.props.areaFade : false;
    let areaFadeColors = typeof(this.props.areaFadeColors) !== 'undefined' ? this.props.areaFadeColors : false;
    let dashedDataArray = typeof(this.props.dashedDataArray) !== 'undefined' ? this.props.dashedDataArray : false;
    let regionFade = typeof(this.props.regionFade) !== 'undefined' ? this.props.regionFade : false;
    let regionFadeColors = typeof(this.props.regionFadeColors) !== 'undefined' ? this.props.regionFadeColors : false;

    let lines = _.map(chart.curves, function (c, i) {
      return <Path key={'lines' + i} d={ c.line.path.print() } strokeDasharray={dashedDataArray.indexOf(i) !== -1 ? '3,3' : ''} stroke={ this.color(i) } strokeWidth={strokeWidth} fill="none"/>
    }.bind(this))
    let areas = null
    if (showAreaForData) {
      areas = _.map(chart.curves, function (c, i) {
        if (showAreaForData.indexOf(i) !== -1) {
          return <G>
            <Defs>
              {areaFade ? <LinearGradient id="areaGrad" x1={'0'} y1={'0'} x2={chart.width} y2={'0'}>
                <Stop offset="0" stopColor={areaFadeColors[0]} stopOpacity="0" />
                <Stop offset="1" stopColor={areaFadeColors[1]} stopOpacity="1" />
              </LinearGradient> : undefined}

            </Defs>
            <Path key={'areas' + i} d={c.area.path.print()} fillOpacity={0.8} stroke="none" fill="url(#areaGrad)" />
          </G>
        }
      }.bind(this))
    }
    else if (showAreas){
      areas = _.map(chart.curves, function (c, i) {
        return <Path key={'areas' + i} d={ c.area.path.print() } fillOpacity={0.3} stroke="none" fill={ this.color(i) }/>
      }.bind(this))
    }
    var points = _.map(chart.curves, function (c) {
      return _.map(c.line.path.points(),function(p,j) {
        return <Circle key={'k' + j} x={p[0]} y={p[1]} stroke='#ffb8c0' fill="#ffb8c0" r={options.r || 5} fillOpacity={1} />
      },this)
    },this)

    points = points[0]

    let textStyle = fontAdapt(options.label)
    let regions
    if(this.props.regions != 'undefined') {
      let styling = typeof(this.props.regionStyling) != 'undefined' ?
        this.props.regionStyling : {}
      let labelOffsetAllRegions = typeof(styling.labelOffset) != 'undefined' ?
        styling.labelOffset : {}

      regions = _.map(this.props.regions, function (c, i) {
        let x, y, height, width, y1, y2, labelX, labelY

        let labelOffset = typeof(c.labelOffset) != 'undefined' ?
          c.labelOffset : {}
        let labelOffsetLeft = typeof(labelOffsetAllRegions.left) != 'undefined'
          ? (typeof(labelOffset.left) != 'undefined'
              ?  labelOffset.left : labelOffsetAllRegions.left) : 20
        let labelOffsetTop = typeof(labelOffsetAllRegions.top) != 'undefined'
          ? (typeof(labelOffset.top) != 'undefined'
              ?  labelOffset.top : labelOffsetAllRegions.top) : 0
        let fillOpacity = typeof(styling.fillOpacity) != 'undefined'
          ? (typeof(c.fillOpacity) != 'undefined'
              ?  c.fillOpacity : styling.fillOpacity) : 0.5

        y1 = chart.yscale(c.from)
        y2 = chart.yscale(c.to)

        x = 0
        y = y1
        height = (y2 - y1)
        width = chartArea.x.max

        labelX = labelOffsetLeft
        labelY = y2 + labelOffsetTop

        let regionLabel = typeof(c.label) != 'undefined' ? (
          <Text fontFamily={textStyle.fontFamily}
                fontSize={textStyle.fontSize}
                fontWeight={textStyle.fontWeight}
                fontStyle={textStyle.fontStyle}
                fill={textStyle.fill}
                textAnchor="middle"
                x={labelX}
                y={labelY}>{ c.label }</Text>
        ) : null

        return (
          <G key={'region' + i}>
            <Defs>
              {regionFade ? <LinearGradient id="parentGrad" x1={'0'} y1={'75'} x2={'0'} y2={'0'}>
                <Stop offset="0" stopColor={regionFadeColors[0]} stopOpacity="0" />
                <Stop offset="1" stopColor={regionFadeColors[1]} stopOpacity="0.5" />
            </LinearGradient> : undefined}

        </Defs>
        <Rect key={'region' + i} x={x} y={y} width={width} height={height} fill="url(#parentGrad)" />
        {regionLabel}
  </G>



        )
      }.bind(this))
    }

    let returnValue = <Svg width={options.width} height={options.height}>
                  <G x={options.margin.left} y={options.margin.top}>
                        { regions }
                        { areas }
                        { points }
                        { lines }
                      <Axis key="x" scale={chart.xscale} options={options.axisX} chartArea={chartArea} />
                      <Axis key="y" scale={chart.yscale} options={options.axisY} chartArea={chartArea} />
                  </G>
              </Svg>

    return returnValue
  }
}
