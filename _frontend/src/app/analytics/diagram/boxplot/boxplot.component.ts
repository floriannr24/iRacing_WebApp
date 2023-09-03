import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {SubsessionProviderService} from "../../../_services/subsession-provider.service";
import {Driver, EventData} from "../../../_services/api.service";

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.scss']
})

export class BoxplotComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>
  @ViewChild('svgTime') svgTime: ElementRef<SVGElement>
  @ViewChild('svgName') svgName: ElementRef<SVGElement>
  @ViewChild('label_detail') label_detail: ElementRef<HTMLDivElement>
  private context: CanvasRenderingContext2D | any
  private appWidth: number
  private appHeight: number
  private scale = 1
  private scaleFactor = 0.1
  private scrollX = 0
  private scrollY = 0
  private data_live: Array<BoxplotElement>
  private data: EventData
  private bpprop: BoxplotProperties
  private diaprop: DiagramProperties
  private highlightedDriver: Driver | null
  private highlightedData: any
  label_scale = "1.0"
  show_label_detail: boolean
  label_detail_content: string;

  constructor(private app: ElementRef, private sps: SubsessionProviderService) {
  }

  ngAfterViewInit() {

    // init for when new subsession gets changed
    this.sps.analyticsData_active.subscribe(analyticsData => {
      this.sps.boxplotProperties_active.subscribe(bpprop => this.bpprop = bpprop)
      this.data = this.loadData(analyticsData)
      this.initBpprop()
      this.diaprop = DiagramProperties.getInstance()
      this.diaprop.yAxisTicks_end = this.data.metadata.timeframe[1] + 50
      this.calculateLinearFunction()
      this.drawSVG_Y_laptimeLabels()
      this.drawSVG_X_driverLabels()
    })

    // init for when bpprop gets changed
    this.sps.boxplotProperties_active.subscribe(bprop => {
      this.bpprop = bprop
      this.sps.analyticsData_active.subscribe(analyticsData => this.data = this.loadData(analyticsData))
      this.initBpprop()
      this.diaprop.yAxisTicks_end = this.data.metadata.timeframe[1] + 50
      this.calculateLinearFunction()
      this.drawSVG_Y_laptimeLabels()
      this.drawSVG_X_driverLabels()
    })

    // first init when website loads
    this.canvas.nativeElement.width = this.appWidth = this.app.nativeElement.parentNode.clientWidth - 130 // 1390
    this.canvas.nativeElement.height = this.appHeight = this.app.nativeElement.parentNode.clientHeight // 786
    this.context = (this.canvas.nativeElement).getContext('2d')
    this.diaprop = DiagramProperties.getInstance()
    this.sps.boxplotProperties_active.subscribe(bpprop => this.bpprop = bpprop)
    this.sps.analyticsData_active.subscribe(analyticsData => this.data = this.loadData(analyticsData))
    this.initBpprop()
    this.diaprop.yAxisTicks_end = this.data.metadata.timeframe[1] + 50
    this.calculateLinearFunction()
    this.initSVGs()
    this.drawSVG_Y_laptimeLabels()
    this.drawSVG_X_driverLabels()
    this.draw()
  }

  @HostListener('wheel', ['$event'])
  mousewheel(event: WheelEvent) {
    this.scaleCanvas(event)
    this.drawSVG_Y_laptimeLabels()
    this.drawSVG_X_driverLabels()
  }

  mousemove(event: MouseEvent) {
    this.detectHover(event)
  }

  private draw() {

    this.context.clearRect(0, 0, this.context.canvas.width / this.scale, this.context.canvas.height / this.scale)

    this.drawBackground()
    this.drawBoxplot()
    this.drawAxes()

    requestAnimationFrame(this.draw.bind(this))

  }

  private drawAxes() {

    this.context.fillStyle = "rgba(15,19,23,0)"
    this.context.fillRect(0, 0, this.diaprop.yAxisBgWidth / this.scale, this.appHeight / this.scale)

    // y-axis
    this.context.beginPath()
    this.context.moveTo(this.diaprop.yAxis_pos / this.scale, 0)
    this.context.lineTo(this.diaprop.yAxis_pos / this.scale, this.appHeight / this.scale)
    this.context.strokeStyle = this.diaprop.yAxis_color
    this.context.lineWidth = 1 / this.scale
    this.context.stroke()

    // full ticks
    for (let i = 0; i < this.diaprop.yAxisTicks_end; i++) {

      let y = this.convertSecondsToPixels(i) - this.scrollY

      this.context.beginPath()
      this.context.strokeStyle = this.diaprop.yAxis_color
      this.context.moveTo((this.diaprop.yAxis_pos - this.diaprop.fullTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
      this.context.lineTo((this.diaprop.yAxis_pos + this.diaprop.fullTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
      this.context.stroke()

      this.context.beginPath()
      this.context.strokeStyle = this.diaprop.fullTick_color
      this.context.moveTo((this.diaprop.yAxis_pos + this.diaprop.fullTick_width / 2) / this.scale, (this.convertSecondsToPixels(i)) - this.scrollY)
      this.context.lineTo((this.diaprop.yAxisBgWidth / this.scale), (this.convertSecondsToPixels(i)) - this.scrollY)
      this.context.stroke()
    }

    // 1/2 ticks
    if (this.scale > 1.0) {
      for (let i = 0.5; i < this.diaprop.yAxisTicks_end; i++) {
        this.context.beginPath()
        this.context.strokeStyle = this.diaprop.yAxis_color
        this.context.moveTo((this.diaprop.yAxis_pos - this.diaprop.halfTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.lineTo((this.diaprop.yAxis_pos + this.diaprop.halfTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.stroke()

        this.context.beginPath()
        this.context.strokeStyle = this.diaprop.halfTick_color
        this.context.moveTo((this.diaprop.yAxis_pos + this.diaprop.halfTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.lineTo(this.diaprop.yAxisBgWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.stroke()
      }
    }

    // 1/4 ticks
    if (this.scale > 2.0) {
      for (let i = 0.25; i < this.diaprop.yAxisTicks_end;) {
        this.context.beginPath()
        this.context.strokeStyle = this.diaprop.yAxis_color
        this.context.moveTo((this.diaprop.yAxis_pos - this.diaprop.quarterTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.lineTo((this.diaprop.yAxis_pos + this.diaprop.quarterTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.stroke()

        this.context.beginPath()
        this.context.strokeStyle = this.diaprop.quarterTick_color
        this.context.moveTo((this.diaprop.yAxis_pos + this.diaprop.quarterTick_width / 2) / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.lineTo(this.diaprop.yAxisBgWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.stroke()

        i = i + 0.5
      }
    }
  }

  private drawBackground() {

    this.context.beginPath()
    this.context.lineWidth = 1 / this.scale
    this.context.strokeStyle = this.diaprop.fullTick_color

    this.numberOfLabelsToDraw()

    // full ticks
    for (let i = 0; i < this.diaprop.yAxisTicks_end; i++) {
      this.context.moveTo(this.diaprop.yAxisBgWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
      this.context.lineTo(this.appWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
    }

    this.context.stroke()

    // 1/2 ticks
    if (this.scale > 1.0) {

      this.context.beginPath()
      this.context.strokeStyle = this.diaprop.halfTick_color

      for (let i = 0.5; i < this.diaprop.yAxisTicks_end; i++) {
        this.context.moveTo(this.diaprop.yAxisBgWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.lineTo(this.appWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
      }
      this.context.stroke()
    }

    // 1/4 ticks
    if (this.scale > 2.0) {

      this.context.beginPath()
      this.context.strokeStyle = this.diaprop.quarterTick_color

      for (let i = 0.25; i < this.diaprop.yAxisTicks_end;) {
        this.context.moveTo(this.diaprop.yAxisBgWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)
        this.context.lineTo(this.appWidth / this.scale, this.convertSecondsToPixels(i) - this.scrollY)

        i = i + 0.5
      }
      this.context.stroke()
    }
  }

  private drawBoxplot() {

    this.data_live = new Array<BoxplotElement>()
    this.calculateBoxplotWidth()

    for (const [i, driver] of this.data.drivers.entries()) {

      if (driver.laps.length > 0) {

        let bpelement = new BoxplotElement()
        this.bpprop.default.bp.prop.location = this.diaprop.yAxisBgWidth + this.bpprop.default.bp.prop.gap + i * (this.bpprop.default.bp.prop.width + this.bpprop.default.bp.prop.gap)
        this.bpprop.default.bp.prop.middle = this.bpprop.default.bp.prop.location + (this.bpprop.default.bp.prop.width / 2)

        // original values (laptimes)
        let median = driver.bpdata.median
        let mean = driver.bpdata.mean
        let q1 = driver.bpdata.Q1
        let q3 = driver.bpdata.Q3
        let whisker_top = driver.bpdata.whisker_top
        let whisker_bottom = driver.bpdata.whisker_bottom
        let fliers_top = driver.bpdata.fliers_top
        let fliers_bottom = driver.bpdata.fliers_bottom

        // calculated values (pixels)
        bpelement.whiskers = this.drawWhiskers(q1, whisker_bottom, q3, whisker_top, driver)
        bpelement.Q1 = this.drawBox(q1, q3, driver).Q1
        bpelement.Q3 = this.drawBox(q1, q3, driver).Q3
        bpelement.median = this.drawMedian(median, driver)
        bpelement.fliers = this.drawFliers(fliers_top, fliers_bottom)
        bpelement.driver = driver

        if (this.bpprop.options['showIndividualLaps'].checked) {
          bpelement.laps = this.drawLaps(driver.laps, driver)
        }

        if (this.bpprop.options['showMean'].checked) {
          bpelement.mean = this.drawMean(mean, driver)
        }

        this.data_live.push(bpelement)
      }
    }
  }

  private drawBox(q1: number, q3: number, driver: Driver) {

    this.setColor_Box(driver)

    let q3_x_start = this.bpprop.default.bp.prop.location - this.scrollX
    let q3_x_end = (this.bpprop.default.bp.prop.location + this.bpprop.default.bp.prop.width) - this.scrollX
    let q3_y = this.convertSecondsToPixels(q3) - this.scrollY

    let q1_x_start = this.bpprop.default.bp.prop.location - this.scrollX
    let q1_x_end = (this.bpprop.default.bp.prop.location + this.bpprop.default.bp.prop.width) - this.scrollX
    let q1_y = this.convertSecondsToPixels(q1) - this.scrollY

    let height = this.convertSecondsToPixels(q3) - this.convertSecondsToPixels(q1)

    this.context.fillRect(q1_x_start, q1_y, this.bpprop.default.bp.prop.width, height)

    //top
    this.context.beginPath()
    if (this.driverSelected(driver) && this.dataTypeHighlighted(DetailType.Q3)) {
      this.context.lineWidth = this.bpprop.default.q3.prop.lineThickness_SELECT / this.scale
      if (this.driverRunning(driver)) {
        this.placeLabelDetail_Running(q3_x_end, q3_y, DetailType.Q3, q3, driver)
      } else {
        this.placeLabelDetail_DiscDisq(q3_x_end, q3_y, DetailType.Q3, q3)
      }
    } else {
      this.context.lineWidth = this.bpprop.default.q3.prop.lineThickness_DEFAULT / this.scale
    }

    this.context.moveTo(q3_x_start, q3_y)
    this.context.lineTo(q3_x_start + this.bpprop.default.bp.prop.width, q3_y)
    this.context.stroke()

    //right
    this.context.beginPath()
    this.context.lineWidth = this.bpprop.default.q3.prop.lineThickness_DEFAULT / this.scale
    this.context.moveTo(q1_x_start + this.bpprop.default.bp.prop.width, q1_y)
    this.context.lineTo(q1_x_start + this.bpprop.default.bp.prop.width, q3_y)
    this.context.stroke()

    //bottom
    this.context.beginPath()
    if (this.driverSelected(driver) && this.dataTypeHighlighted(DetailType.Q1)) {
      this.context.lineWidth = this.bpprop.default.q1.prop.lineThickness_SELECT / this.scale

      if (this.driverRunning(driver)) {
        this.placeLabelDetail_Running(q1_x_end, q1_y, DetailType.Q1, q1, driver)
      } else {
        this.placeLabelDetail_DiscDisq(q1_x_end, q1_y, DetailType.Q1, q1)
      }

    } else {
      this.context.lineWidth = this.bpprop.default.q1.prop.lineThickness_DEFAULT / this.scale
    }
    this.context.moveTo(q1_x_start, q1_y)
    this.context.lineTo(q1_x_start + this.bpprop.default.bp.prop.width, q1_y)
    this.context.stroke()

    //left
    this.context.beginPath()
    this.context.lineWidth = this.bpprop.default.q1.prop.lineThickness_DEFAULT  / this.scale
    this.context.moveTo(q1_x_start, q1_y)
    this.context.lineTo(q1_x_start, q3_y)
    this.context.stroke()

    return {
      Q1: {
        x: {
          start: q1_x_start,
          end: q1_x_end
        },
        y: q1_y
      },

      Q3: {
        x: {
          start: q3_x_start,
          end: q3_x_end
        },
        y: q3_y
      }
    }
  }

  private drawMedian(median: number, driver: Driver) {

    this.setColor_Median(driver)

    let median_x_start = this.bpprop.default.bp.prop.location - this.scrollX
    let median_x_end = this.bpprop.default.bp.prop.location + this.bpprop.default.median.prop.width - this.scrollX
    let median_y = this.convertSecondsToPixels(median) - this.scrollY

    this.context.beginPath()

    if (this.driverSelected(driver) && this.dataTypeHighlighted(DetailType.MEDIAN)) {
      this.context.lineWidth = (this.bpprop.default.median.prop.lineThickness_SELECT) / this.scale
      this.context.moveTo(median_x_start, median_y)
      this.context.lineTo(median_x_end, median_y)

      if (this.driverRunning(driver)) {
        this.placeLabelDetail_Running(median_x_end, median_y, DetailType.MEDIAN, median, driver)
      } else {
        this.placeLabelDetail_DiscDisq(median_x_end, median_y, DetailType.MEDIAN, median)
      }

    } else {
      this.context.lineWidth = this.bpprop.default.median.prop.lineThickness_DEFAULT / this.scale
      this.context.moveTo(median_x_start, median_y)
      this.context.lineTo(median_x_end, median_y)
    }

    this.context.stroke()

    return {
      x: {
        start: median_x_start,
        end: median_x_end
      },
      y: median_y
    }
  }

  private drawMean(mean: number, driver: Driver) {

    this.setColor_Mean()

    let mean_x = this.bpprop.default.bp.prop.middle - this.scrollX
    let mean_y = this.convertSecondsToPixels(mean) - this.scrollY

    this.context.beginPath()

    if (this.driverSelected(driver) && this.dataTypeHighlighted(DetailType.MEAN)) {
      this.context.arc(mean_x, mean_y, this.bpprop.default.mean.prop.radius_SELECT, 0, (Math.PI / 180) * 360)
      this.placeLabelDetail_Running(mean_x, mean_y, DetailType.MEAN, mean, driver)
    } else {
      this.context.arc(mean_x, mean_y, this.bpprop.default.mean.prop.radius_DEFAULT, 0, (Math.PI / 180) * 360)
    }

    this.context.fill()

    return {
      x: mean_x,
      y: mean_y
    }
  }

  private drawWhiskers(q1: number, whisker_bottom: number, q3: number, whisker_top: number, driver: Driver) {

    this.setColor_Whiskers(driver)

    //line to whisker top
    this.context.beginPath()
    this.context.lineWidth = this.bpprop.default.whiskers.prop.lineThickness_DEFAULT / this.scale
    this.context.moveTo(this.bpprop.default.bp.prop.middle - this.scrollX, this.convertSecondsToPixels(q3) - this.scrollY)
    this.context.lineTo(this.bpprop.default.bp.prop.middle - this.scrollX, this.convertSecondsToPixels(whisker_top) - this.scrollY)
    this.context.stroke()

    // whisker top
    let top_x_start = this.bpprop.default.bp.prop.middle - this.bpprop.default.whiskers.prop.width / 2 - this.scrollX
    let top_x_end = this.bpprop.default.bp.prop.middle + this.bpprop.default.whiskers.prop.width / 2 - this.scrollX
    let top_y = this.convertSecondsToPixels(whisker_top) - this.scrollY

    // on-hover (whisker top)

    this.context.beginPath()

    if (this.driverSelected(driver) && this.dataTypeHighlighted(DetailType.WHISKER_TOP)) {

      this.context.lineWidth = (this.bpprop.default.whiskers.prop.lineThickness_SELECT) / this.scale
      this.context.moveTo(top_x_start, top_y)
      this.context.lineTo(top_x_end, top_y)

      if (this.driverRunning(driver)) {
        this.placeLabelDetail_Running(top_x_end, top_y, DetailType.WHISKER_TOP, whisker_top, driver)
      } else {
        this.placeLabelDetail_DiscDisq(top_x_end, top_y, DetailType.WHISKER_TOP, whisker_top)
      }

    } else {
      this.context.lineWidth = this.bpprop.default.whiskers.prop.lineThickness_DEFAULT / this.scale
      this.context.moveTo(top_x_start, top_y)
      this.context.lineTo(top_x_end, top_y)
    }
    this.context.stroke()

    //line to whisker bottom
    this.context.beginPath()
    this.context.lineWidth = this.bpprop.default.whiskers.prop.lineThickness_DEFAULT / this.scale
    this.context.moveTo(this.bpprop.default.bp.prop.middle - this.scrollX, this.convertSecondsToPixels(q1) - this.scrollY)
    this.context.lineTo(this.bpprop.default.bp.prop.middle - this.scrollX, this.convertSecondsToPixels(whisker_bottom) - this.scrollY)
    this.context.stroke()

    // whisker bottom
    let bottom_x_start = this.bpprop.default.bp.prop.middle - this.bpprop.default.whiskers.prop.width / 2 - this.scrollX
    let bottom_x_end = this.bpprop.default.bp.prop.middle + this.bpprop.default.whiskers.prop.width / 2 - this.scrollX
    let bottom_y = this.convertSecondsToPixels(whisker_bottom) - this.scrollY

    this.context.beginPath()

    // on-hover (whisker bottom)
    if (this.driverSelected(driver) && this.dataTypeHighlighted(DetailType.WHISKER_BOTTOM)) {

      this.context.lineWidth = (this.bpprop.default.whiskers.prop.lineThickness_SELECT) / this.scale
      this.context.moveTo(bottom_x_start, bottom_y)
      this.context.lineTo(bottom_x_end, bottom_y)

      if (this.driverRunning(driver)) {
        this.placeLabelDetail_Running(bottom_x_end, bottom_y, DetailType.WHISKER_BOTTOM, whisker_bottom, driver)
      } else {
        this.placeLabelDetail_DiscDisq(bottom_x_end, bottom_y, DetailType.WHISKER_BOTTOM, whisker_bottom)
      }

    } else {
      this.context.lineWidth = this.bpprop.default.whiskers.prop.lineThickness_DEFAULT / this.scale
      this.context.moveTo(bottom_x_start, bottom_y)
      this.context.lineTo(bottom_x_end, bottom_y)
    }
    this.context.stroke()

    return {
      top: {
        x: {
          start: top_x_start,
          end: top_x_end
        },
        y: top_y
      },
      bottom: {
        x: {
          start: bottom_x_start,
          end: bottom_x_end
        },
        y: bottom_y
      }
    }
  }

  private drawFliers(fliers_top: Array<number>, fliers_bottom: Array<number>) {

    this.setColor_Fliers()

    let fliersArray_top: Array<Fliers> = []
    let fliersArray_bottom: Array<Fliers> = []

    fliers_top.forEach(flier => {

      let flier_x = this.bpprop.default.bp.prop.middle - this.scrollX
      let flier_y = this.convertSecondsToPixels(flier) - this.scrollY

      this.context.beginPath()
      this.context.lineWidth = this.bpprop.default.fliers.lineThickness
      this.context.arc(flier_x, flier_y, this.bpprop.default.fliers.radius, 0, (Math.PI / 180) * 360)
      this.context.stroke()

      fliersArray_top.push({x: flier_x, y: flier_y})

    })

    fliers_bottom.forEach(flier => {

      let flier_x = this.bpprop.default.bp.prop.middle - this.scrollX
      let flier_y = this.convertSecondsToPixels(flier) - this.scrollY

      this.context.beginPath()
      this.context.lineWidth = this.bpprop.default.fliers.lineThickness
      this.context.arc(flier_x, flier_y, this.bpprop.default.fliers.radius, 0, (Math.PI / 180) * 360)
      this.context.stroke()

      fliersArray_bottom.push({x: flier_x, y: flier_y})

    })
    return {top: fliersArray_top, bottom: fliersArray_bottom}
  }

  private drawLaps(laps: Array<number>, driver: Driver) {

    let lapsArray: Array<Lap> = []

    for (const [i, lap] of laps.entries()) {
      let lap_x = (this.bpprop.default.bp.prop.middle + driver.bpdata.laps_rndFactors[i]) - this.scrollX
      let lap_y = this.convertSecondsToPixels(lap) - this.scrollY

      this.context.beginPath()

      if (this.driverSelected(driver) && this.highlightedData == lap_y) {
        this.context.arc(lap_x, lap_y, this.bpprop.default.laps.prop.radius_SELECT, 0, (Math.PI / 180) * 360)
        this.placeLabelDetail_Running(lap_x, lap_y, DetailType.LAP, lap, driver, i + 1)
      } else {
        this.context.arc(lap_x, lap_y, this.bpprop.default.laps.prop.radius_DEFAULT, 0, (Math.PI / 180) * 360)
      }

      this.context.fillStyle = this.bpprop.default.laps.color.line
      this.context.fill()

      lapsArray.push({x: lap_x, y: lap_y})
    }
    return lapsArray
  }

  private drawSVG_Y_laptimeLabels() {

    let gContainer = this.init_gContainer("gContainerTime", this.svgTime);

    let x = this.diaprop.tickLabel_x

    // omit every 2nd tick
    if (this.scale < 0.7) {
      for (let i = 0; i < this.diaprop.yAxisTicks_end;) {

        let y = (this.convertSecondsToPixels(i) - this.scrollY) * this.scale + 9.5

        if (0 < y && y < this.appHeight) {

          let element = document.createElementNS('http://www.w3.org/2000/svg', 'text');

          let time = this.convertTimeFormat(i)

          element.setAttribute("x", x.toString())
          element.setAttribute("y", y.toString())
          element.setAttribute("fill", this.diaprop.fullTickLabel_fontColor)
          element.setAttribute("transform", "scale(1.1)")
          element.style.transformBox = "fill-box"
          element.style.transformOrigin = "right 50%"
          element.setAttribute("font-size", this.diaprop.fullTickLabel_fontSize + "px")
          element.setAttribute("text-rendering", "geometricPrecision")
          element.textContent = time

          gContainer.append(element)
        }

        i = i + 2

      }
    }

    // full ticks
    if (this.scale >= 0.7) {
      for (let i = 0; i < this.diaprop.yAxisTicks_end; i++) {

        let y = (this.convertSecondsToPixels(i) - this.scrollY) * this.scale + 9.5

        if (0 < y && y < this.appHeight) {

          let element = document.createElementNS('http://www.w3.org/2000/svg', 'text');

          let time = this.convertTimeFormat(i)

          element.setAttribute("x", x.toString())
          element.setAttribute("y", y.toString())
          element.setAttribute("fill", this.diaprop.fullTickLabel_fontColor)
          element.setAttribute("transform", "scale(1.1)")
          element.style.transformBox = "fill-box"
          element.style.transformOrigin = "right 50%"
          element.setAttribute("font-size", this.diaprop.fullTickLabel_fontSize + "px")
          element.setAttribute("text-rendering", "geometricPrecision")
          element.textContent = time

          gContainer.append(element)
        }
      }
    }

    // 1/2 ticks
    if (this.scale > 2.0) {
      for (let i = 0.5; i < this.diaprop.yAxisTicks_end; i++) {

        let y = (this.convertSecondsToPixels(i) - this.scrollY) * this.scale + 9.5

        if (0 < y && y < this.appHeight) {

          let element = document.createElementNS('http://www.w3.org/2000/svg', 'text');

          let time = this.convertTimeFormat(i)

          element.setAttribute("x", x.toString())
          element.setAttribute("y", y.toString())
          element.setAttribute("fill", this.diaprop.halfTickLabel_fontColor)
          element.setAttribute("transform", "scale(1.1)")
          element.style.transformBox = "fill-box"
          element.style.transformOrigin = "right 50%"
          element.setAttribute("font-size", this.diaprop.halfTickLabel_fontSize + "px")
          element.setAttribute("text-rendering", "geometricPrecision")
          element.textContent = time

          gContainer.append(element)
        }

      }
    }
  }

  private drawSVG_X_driverLabels() {

    let gContainer = this.init_gContainer("gContainerName", this.svgName);

    for (const [i, driver] of this.data.drivers.entries()) {

      let x_pos = this.calc_xPosition(i);

      let textElement_name = this.drawSVG_X_driverLabels_name(x_pos, driver);
      gContainer.append(textElement_name)

      let textElement_finishPosition = this.drawSVG_X_driverLabels_finishPosition(x_pos, driver);
      gContainer.append(textElement_finishPosition)

    }
  }

  private init_gContainer(name: string, svgElement: ElementRef<SVGElement>) {

    let temp = document.getElementById(name)

    if (temp) {
      temp.remove()
    }

    let gContainer = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gContainer.setAttribute("id", name)
    svgElement.nativeElement.append(gContainer)

    return gContainer;
  }

  private calc_xPosition(i: number) {

    let bp_width = this.bpprop.default.bp.prop.width

    while (1390 < this.diaprop.yAxisBgWidth + this.bpprop.default.bp.prop.gap + (this.data.drivers.length) * (bp_width + this.bpprop.default.bp.prop.gap)) {
      bp_width = bp_width - 0.1
    }

    let bp_location = this.diaprop.yAxisBgWidth + this.bpprop.default.bp.prop.gap + i * (bp_width + this.bpprop.default.bp.prop.gap)
    let bp_middle = (bp_location + (bp_width / 2) - this.scrollX) * this.scale

    return bp_middle + 130;
  }

  private drawSVG_X_driverLabels_name(x_pos: number, driver: Driver) {

    let driver_name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    let y_pos = this.diaprop.drivernameLabel_y

    driver_name.setAttribute("x", x_pos.toString())
    driver_name.setAttribute("y", y_pos.toString())
    driver_name.setAttribute("fill", this.diaprop.drivernameLabel_fontColor)
    driver_name.setAttribute("transform", "rotate(300)")
    driver_name.style.transformBox = "fill-box"
    driver_name.style.transformOrigin = "right 50%"
    driver_name.setAttribute("text-anchor", "end")
    driver_name.setAttribute("font-size", this.diaprop.drivernameLabel_fontSize + "px")
    driver_name.setAttribute("text-rendering", "geometricPrecision")
    driver_name.textContent = driver.name

    if (driver.name == this.bpprop.userDriver.name) {
      driver_name.setAttribute("font-weight", "bold")
      driver_name.setAttribute("fill", "white")
    }

    return driver_name
  }

  private drawSVG_X_driverLabels_finishPosition(x_pos: number, driver: Driver) {

    let driver_finishPosition = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    let y_pos = this.diaprop.driverPositionLabel_y

    driver_finishPosition.setAttribute("x", x_pos.toString())
    driver_finishPosition.setAttribute("y", y_pos.toString())
    driver_finishPosition.setAttribute("fill", this.diaprop.driverPositionLabel_fontColor)
    driver_finishPosition.style.transformBox = "fill-box"
    driver_finishPosition.style.transformOrigin = "center 50%"
    driver_finishPosition.setAttribute("text-anchor", "middle")
    driver_finishPosition.setAttribute("font-size", this.diaprop.driverPositionLabel_fontSize + "px")
    driver_finishPosition.setAttribute("text-rendering", "geometricPrecision")

    if (this.bpprop.options["showMulticlass"].checked) {
      driver_finishPosition.textContent = driver.finish_position.toString()
    } else {
      driver_finishPosition.textContent = driver.finish_position_in_class.toString()
    }

    if (driver.name == this.bpprop.userDriver.name) {
      driver_finishPosition.setAttribute("font-weight", "bold")
      driver_finishPosition.setAttribute("fill", "white")
    }

    return driver_finishPosition
  }

  private convertSecondsToPixels(seconds: number) {
    return Math.round(this.bpprop.lineafunction_m * seconds + this.bpprop.linearfunction_t) + 0.5
  }

  private placeLabelDetail_Running(x_pos: number, y_pos: number, type: DetailType, time: number, driver: Driver, lapNr?: number) {

    this.label_detail.nativeElement.style.top = y_pos * this.scale - 10 + "px"

    let time_str = this.convertTimeFormat(time)

    if (type == DetailType.LAP) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_dot_gap + "px"
      this.label_detail_content = time_str + " (" + lapNr + ")"
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.laps.color.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.laps.color.detail.bg
    }

    if (type == DetailType.MEAN) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_dot_gap + "px"
      this.label_detail_content = time_str
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.mean.color.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.mean.color.detail.bg
    }

    if (type == DetailType.MEDIAN) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_q1q3median_gap + "px"
      this.label_detail_content = time_str
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.median.color.running.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.median.color.running.detail.bg

      if (this.bpprop.options['showMulticlass'].checked && this.bpprop.userDriver.car_class_id != driver.car_class_id) {
          let carclassProp = this.setBprop_carclass(driver)
          this.label_detail.nativeElement.style.borderColor = carclassProp.median.color.running.detail.line
          this.label_detail.nativeElement.style.background = carclassProp.median.color.running.detail.bg
        } else {
          this.label_detail.nativeElement.style.borderColor = this.bpprop.default.median.color.running.detail.line
          this.label_detail.nativeElement.style.background = this.bpprop.default.median.color.running.detail.bg
      }

      if (this.bpprop.options['showFasterSlower'].checked) {
        let delta_nmbr = (driver.bpdata.median - this.bpprop.userDriver.bpdata.median)

        if (delta_nmbr > 0) {
          this.label_detail_content = time_str + " (" + "+" + delta_nmbr.toFixed(3).toString() + ")"
        } else if (delta_nmbr < 0) {
          this.label_detail_content = time_str + " (" + delta_nmbr.toFixed(3).toString() + ")"
        } else {
          this.label_detail_content = time_str
        }

        if (driver.bpdata.median > this.bpprop.userDriver.bpdata.median) {
          this.label_detail.nativeElement.style.borderColor = this.bpprop.default.median.color.slower.detail.line
          this.label_detail.nativeElement.style.background = this.bpprop.default.median.color.slower.detail.bg
        }
        if (driver.bpdata.median < this.bpprop.userDriver.bpdata.median) {
          this.label_detail.nativeElement.style.borderColor = this.bpprop.default.median.color.faster.detail.line
          this.label_detail.nativeElement.style.background = this.bpprop.default.median.color.faster.detail.bg
        }
        if (driver.name == this.bpprop.userDriver.name) {
          this.label_detail.nativeElement.style.borderColor = this.bpprop.default.median.color.user.highlight.detail.line
          this.label_detail.nativeElement.style.background = this.bpprop.default.median.color.user.highlight.detail.bg
        }
      }
    }

    if (type == DetailType.WHISKER_TOP || type == DetailType.WHISKER_BOTTOM) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_whisker_gap + "px"
      this.label_detail_content = time_str

      if (this.bpprop.options['showMulticlass'].checked && this.bpprop.userDriver.car_class_id != driver.car_class_id) {
        let carclassProp = this.setBprop_carclass(driver)
        this.label_detail.nativeElement.style.borderColor = carclassProp.whiskers.color.running.line
        this.label_detail.nativeElement.style.background = carclassProp.whiskers.color.running.detail.bg
      } else {
        this.label_detail.nativeElement.style.borderColor = this.bpprop.default.whiskers.color.running.line
        this.label_detail.nativeElement.style.background = this.bpprop.default.whiskers.color.running.detail.bg
      }
    }

    if (type == DetailType.Q1 || type == DetailType.Q3) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_q1q3median_gap + "px"
      this.label_detail_content = time_str

      if (this.bpprop.options['showMulticlass'].checked && this.bpprop.userDriver.car_class_id != driver.car_class_id) {
        let carclassProp = this.setBprop_carclass(driver)
        this.label_detail.nativeElement.style.borderColor = carclassProp.bp.color.running.detail.line
        this.label_detail.nativeElement.style.background = carclassProp.bp.color.running.detail.bg
      } else {
        this.label_detail.nativeElement.style.borderColor = this.bpprop.default.bp.color.running.detail.line
        this.label_detail.nativeElement.style.background = this.bpprop.default.bp.color.running.detail.bg
      }


    }
  }

  private placeLabelDetail_DiscDisq(x_pos: number, y_pos: number, type: DetailType, time: number, lapNr?: number) {

    this.label_detail.nativeElement.style.top = y_pos * this.scale - 10 + "px"

    let time_str = this.convertTimeFormat(time)

    if (type == DetailType.LAP) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_dot_gap + "px"
      this.label_detail_content = time_str + " (" + lapNr + ")"
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.laps.color.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.laps.color.detail.bg
    }

    if (type == DetailType.MEAN) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_dot_gap + "px"
      this.label_detail_content = time_str
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.mean.color.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.mean.color.detail.bg
    }

    if (type == DetailType.MEDIAN) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_q1q3median_gap + "px"
      this.label_detail_content = time_str
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.median.color.disc.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.median.color.disc.detail.bg
    }

    if (type == DetailType.WHISKER_TOP || type == DetailType.WHISKER_BOTTOM) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_whisker_gap + "px"
      this.label_detail_content = time_str
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.whiskers.color.disc.detail.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.whiskers.color.disc.detail.bg
    }

    if (type == DetailType.Q1 || type == DetailType.Q3) {
      this.label_detail.nativeElement.style.left = x_pos * this.scale + 130 + this.diaprop.laptime_detail_q1q3median_gap + "px"
      this.label_detail_content = time_str
      this.label_detail.nativeElement.style.borderColor = this.bpprop.default.bp.color.disc.line
      this.label_detail.nativeElement.style.background = this.bpprop.default.bp.color.disc.bg
    }
  }

  private convertTimeFormat(time: number) {

    let minutes = (Math.floor(time / 60))
    let seconds = (time - minutes * 60)

    if (seconds < 10) {
      return minutes.toString() + ":" + "0" + seconds.toFixed(3)
    } else {
      return minutes.toString() + ":" + seconds.toFixed(3)
    }
  }

  private numberOfLabelsToDraw() {
    return Math.round(Math.ceil(768 / this.diaprop.fullTick_spacing) / this.scale) + 1

  }

  private calculateLinearFunction() {

    let tickSpacing = this.diaprop.fullTick_spacing

    let x1 = this.data.metadata.median
    let y1 = this.appHeight / 2

    this.bpprop.lineafunction_m = -tickSpacing
    this.bpprop.linearfunction_t = y1 - (-tickSpacing * x1)
  }

  private calculateBoxplotWidth() {

    while (1390 < this.diaprop.yAxisBgWidth + this.bpprop.default.bp.prop.gap + this.data.drivers.length * (this.bpprop.default.bp.prop.width + this.bpprop.default.bp.prop.gap)) {
      this.bpprop.default.bp.prop.width = this.bpprop.default.bp.prop.width - 0.1
    }
    this.bpprop.default.median.prop.width = this.bpprop.default.bp.prop.width
    this.bpprop.default.whiskers.prop.width = this.bpprop.default.bp.prop.width * 0.6
  }

  private scaleCanvas(event: WheelEvent) {
    event.preventDefault()
    let previousScale = this.scale
    let direction = event.deltaY > 0 ? -1 : 1
    this.scale += this.scaleFactor * direction
    this.label_scale = this.scale.toFixed(1)

    if (this.scale >= 0.40000000000000013) {

      this.scrollX += (event.offsetX / previousScale) - (event.offsetX / this.scale);
      this.scrollY += (event.offsetY / previousScale) - (event.offsetY / this.scale);

      this.context.setTransform(1, 0, 0, 1, 0, 0)
      this.context.scale(this.scale, this.scale)
    } else {
      this.scale = 0.40000000000000013
      this.scrollX += (event.offsetX / previousScale) - (event.offsetX / 0.40000000000000013);
      this.scrollY += (event.offsetY / previousScale) - (event.offsetY / 0.40000000000000013);
      this.context.setTransform(1, 0, 0, 1, 0, 0)
      this.context.scale(this.scale, this.scale)
    }
  }

  private detectHover(event: MouseEvent) {
    let x = event.offsetX / this.scale
    let y = event.offsetY / this.scale

    this.highlightedDriver = null

    this.context.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    outerloop:
      for (let i = this.data_live.length - 1, element; element = this.data_live[i]; i--) {

        let laps = element.laps
        let mean = element.mean
        let median = element.median
        let whisker_top = element.whiskers.top
        let whisker_btm = element.whiskers.bottom
        let q3 = element.Q3
        let q1 = element.Q1
        let driver = element.driver

        //laps
        if (this.bpprop.options['showIndividualLaps'].checked) {
          for (let d = laps.length - 1, lap; lap = laps[d]; d--) {
            if (x >= (lap.x - this.bpprop.default.laps.prop.radius_HITBOX) && x <= lap.x + this.bpprop.default.laps.prop.radius_HITBOX && y >= (lap.y - this.bpprop.default.laps.prop.radius_HITBOX) && y <= (lap.y + this.bpprop.default.laps.prop.radius_HITBOX)) {
              this.highlightedDriver = this.data.drivers[i]
              this.highlightedData = laps[d].y
              this.show_label_detail = true
              break outerloop
            } else {
              this.show_label_detail = false
            }
          }
        }

        // mean
        if (this.bpprop.options['showMean'].checked) {
          if (x >= (mean.x - this.bpprop.default.mean.prop.radius_HITBOX) && x <= (mean.x + this.bpprop.default.mean.prop.radius_HITBOX) && y >= (mean.y - this.bpprop.default.mean.prop.radius_HITBOX) && y <= (mean.y + this.bpprop.default.mean.prop.radius_HITBOX)) {
            this.highlightedDriver = this.data.drivers[i]
            this.highlightedData = DetailType.MEAN
            this.show_label_detail = true
            break
          } else {
            this.show_label_detail = false
          }
        }

        // median
        if (x >= median.x.start && x <= median.x.end && y >= median.y - this.bpprop.default.median.prop.lineThickness_HITBOX && y <= median.y + this.bpprop.default.median.prop.lineThickness_HITBOX) {
          this.highlightedDriver = this.data.drivers[i]
          this.highlightedData = DetailType.MEDIAN
          this.show_label_detail = true
          break
        } else {
          this.show_label_detail = false
        }

        // whisker-top
        if (x >= whisker_top.x.start && x <= whisker_top.x.end && y >= whisker_top.y - this.bpprop.default.whiskers.prop.lineThickness_HITBOX && y <= whisker_top.y + this.bpprop.default.whiskers.prop.lineThickness_HITBOX) {
          this.highlightedDriver = this.data.drivers[i]
          this.highlightedData = DetailType.WHISKER_TOP
          this.show_label_detail = true
          break
        } else {
          this.show_label_detail = false
        }

        //whisker-bottom
        if (x >= whisker_btm.x.start && x <= whisker_btm.x.end && y >= whisker_btm.y - this.bpprop.default.whiskers.prop.lineThickness_HITBOX && y <= whisker_btm.y + this.bpprop.default.whiskers.prop.lineThickness_HITBOX) {
          this.highlightedDriver = this.data.drivers[i]
          this.highlightedData = DetailType.WHISKER_BOTTOM
          this.show_label_detail = true
          break
        } else {
          this.show_label_detail = false
        }

        //q3
        if (x >= q3.x.start && x <= q3.x.end && y >= q3.y - this.bpprop.default.q3.prop.lineThickness_HITBOX && y <= q3.y + this.bpprop.default.q3.prop.lineThickness_HITBOX) {
          this.highlightedDriver = this.data.drivers[i]
          this.highlightedData = DetailType.Q3
          this.show_label_detail = true
          break
        } else {
          this.show_label_detail = false
        }

        //q1
        if (x >= q1.x.start && x <= q1.x.end && y >= q1.y - this.bpprop.default.q1.prop.lineThickness_HITBOX && y <= q1.y + this.bpprop.default.q1.prop.lineThickness_HITBOX) {
          this.highlightedDriver = this.data.drivers[i]
          this.highlightedData = DetailType.Q1
          this.show_label_detail = true
          break
        } else {
          this.show_label_detail = false
        }
      }

  }

  private initSVGs() {
    this.svgTime.nativeElement.style.height = this.appHeight + "px"
    this.svgTime.nativeElement.style.width = "130px"

    let svgName_width = this.appWidth + 130 + "px"
    this.svgName.nativeElement.style.top = "550px"
    this.svgName.nativeElement.style.height = this.appHeight + "px"
    this.svgName.nativeElement.style.width = this.appWidth + 130 + "px"

    let separator = document.createElementNS("http://www.w3.org/2000/svg", "rect")

    separator.setAttribute("width", svgName_width)
    separator.setAttribute("height", "1px")
    separator.setAttribute("fill", "rgba(105, 114, 125, 0.31)")
    separator.setAttribute("y", "0px")

    this.svgName.nativeElement.append(separator)
  }

  private loadData(data: EventData) {

    // set user driver in bpprop
    data.drivers.forEach(driver => {
      if (driver.name == this.bpprop.userDriver.name) {
        this.bpprop.userDriver = driver
      }
    })

    if (!this.bpprop.options['showMulticlass'].checked) {
      return this.removeCarClasses(data)
    }

    if(!this.bpprop.options['showDiscDisq'].checked) {
      return this.removeDiscDisqDrivers(data)
    }

    return data
  }

  private removeDiscDisqDrivers(data: EventData) {

    let drivers_new = new Array<Driver>()

    for (let i = 0; i < data.drivers.length; i++) {
      if (data.drivers[i].result_status == "Running") {
        drivers_new.push(data.drivers[i])
      }
    }

    let data_new = structuredClone(data)
    data_new.drivers = drivers_new

    return data_new
  }

  private dataTypeHighlighted(type: DetailType) {
    return this.highlightedData == type;
  }

  private driverRunning(driver: Driver) {
    return driver.result_status == "Running";
  }

  private driverSelected(driver: Driver) {
    return driver == this.highlightedDriver;
  }

  private setColor_Box(driver: Driver) {

    if (driver.name == this.bpprop.userDriver.name) {
      this.context.fillStyle = this.bpprop.default.bp.color.user.bg
      this.context.strokeStyle = this.bpprop.default.bp.color.user.line
    } else {
      if (driver.car_class_id == this.bpprop.userDriver.car_class_id) {
        this.context.fillStyle = this.bpprop.default.bp.color.running.bg
        this.context.strokeStyle = this.bpprop.default.bp.color.running.line
      } else {
        let carclassProp = this.setBprop_carclass(driver)
        this.context.fillStyle = carclassProp.bp.color.running.bg
        this.context.strokeStyle = carclassProp.bp.color.running.line
      }
    }

    if (driver.result_status == "Disconnected" || driver.result_status == "Disqualified") {
      this.context.fillStyle = this.bpprop.default.bp.color.disc.bg
      this.context.strokeStyle = this.bpprop.default.bp.color.disc.line
    }
  }

  private setColor_Median(driver: Driver) {

    // default median color
    this.context.strokeStyle = this.bpprop.default.median.color.running.line

    // username
    if (driver.name == this.bpprop.userDriver.name) {
      this.context.strokeStyle = this.bpprop.default.median.color.user.line
    } else {
      if (driver.car_class_id == this.bpprop.userDriver.car_class_id) {
        this.context.strokeStyle = this.bpprop.default.median.color.running.line
      } else {
        let carclassProp = this.setBprop_carclass(driver)
        this.context.strokeStyle = carclassProp.median.color.running.line
      }
    }

    // faster drivers = red / slower name = green / user name = yellow
    if (this.bpprop.options['showFasterSlower'].checked) {
      if (driver.bpdata.median > this.bpprop.userDriver.bpdata.median) {
        this.context.strokeStyle = this.bpprop.default.median.color.slower.line
      }
      if (driver.bpdata.median < this.bpprop.userDriver.bpdata.median) {
        this.context.strokeStyle = this.bpprop.default.median.color.faster.line
      }
      if (driver.name == this.bpprop.userDriver.name) {
        this.context.strokeStyle = this.bpprop.default.median.color.user.highlight.line
      }
    }

    // disc, disq = grey
    if (driver.result_status == "Disconnected" || driver.result_status == "Disqualified") {
      this.context.strokeStyle = this.bpprop.default.median.color.disc.line
    }
  }

  private setColor_Mean() {
    this.context.fillStyle = this.bpprop.default.mean.color.line
  }

  private setColor_Whiskers(driver: Driver) {

    if (driver.result_status == "Disconnected" || driver.result_status == "Disqualified") {
      this.context.strokeStyle = this.bpprop.default.whiskers.color.disc.line
    } else if (driver.name == this.bpprop.userDriver.name) {
      this.context.strokeStyle = this.bpprop.default.whiskers.color.user.line
    } else if (driver.car_class_id == this.bpprop.userDriver.car_class_id) {
      this.context.strokeStyle = this.bpprop.default.whiskers.color.running.line
    } else {
      let carclassProp = this.setBprop_carclass(driver)
      this.context.strokeStyle = carclassProp.whiskers.color.running.line
    }

  }

  private setColor_Fliers() {
    this.context.strokeStyle = this.bpprop.default.fliers.color
  }

  private initBpprop() {

    // reset bp-width
    this.bpprop.default.bp.prop.width = 200

    // if multiclass: for each car-class, assign a specific property-object (= color scheme)
    if (this.bpprop.options['showMulticlass'].checked && this.data.metadata.carclasses.length > 1) {
      let listWithoutUserCarclass = this.data.metadata.carclasses.filter(item => item !== this.bpprop.userDriver.car_class_id)
      let listOfCarclassProps = [this.bpprop.carclass2, this.bpprop.carclass3, this.bpprop.carclass4, this.bpprop.carclass5]

            while (listWithoutUserCarclass.length < listOfCarclassProps.length) {
        listOfCarclassProps = listOfCarclassProps.splice(0,listOfCarclassProps.length-1)
      }

      for (let i = 0; i < listWithoutUserCarclass.length; i++) {
        listOfCarclassProps[i].carclass_id = listWithoutUserCarclass[i]
      }
    }
  }

  private removeCarClasses(data: EventData) {

    let drivers_new = new Array<Driver>()

    let userDriverClass = this.findUserCarClass(data)

    for (let i = 0; i < data.drivers.length; i++) {
      if (data.drivers[i].car_class_id == userDriverClass) {
        drivers_new.push(data.drivers[i])
      }
    }

    let data_new = structuredClone(data)
    data_new.drivers = drivers_new

    if (this.bpprop.options["showDiscDisq"].checked) {
      return data_new
    } else {
      return this.removeDiscDisqDrivers(data_new)
    }
  }

  private findUserCarClass(data: EventData) {

    let carClassID: number = 0

    for (let i = 0; i < data.drivers.length; i++) {
      if (data.drivers[i].name == this.bpprop.userDriver.name) {
        carClassID = data.drivers[i].car_class_id

      }
    }
    return carClassID
  }

  private setBprop_carclass(driver: Driver) {

    switch (driver.car_class_id) {
      case this.bpprop.carclass2.carclass_id: return this.bpprop.carclass2
      case this.bpprop.carclass3.carclass_id: return this.bpprop.carclass3
      case this.bpprop.carclass4.carclass_id: return this.bpprop.carclass4
      case this.bpprop.carclass5.carclass_id: return this.bpprop.carclass5
      default: return this.bpprop.default
    }
  }
}

export class BoxplotProperties {

  private static _instance: BoxplotProperties

  private constructor() {
  }

  static getInstance(): BoxplotProperties {
    if (!BoxplotProperties._instance) {
      BoxplotProperties._instance = new BoxplotProperties()
    }
    return BoxplotProperties._instance
  }

  userDriver: Driver

  lineafunction_m: number // calculated
  linearfunction_t: number // calculated

  // default = carclass1
  default = {
    carclass_id: 0, // calculated
    bp: {
      color: {
        running: {
          bg: "rgba(0,27,59,0.2)",
          line: "#1a88ff",
          detail: {
            bg: "#093059",
            line: "#1a88ff"
          }
        },
        disc: {
          bg: "rgba(77,77,77,0.4)",
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999",
          }
        },
        user: {
          bg: "rgba(166,206,255,0.2)",
          line: "#a6cfff",
          detail: {
            bg: "#d000ff",
            line: "#d000ff"
          }
        },
      },
      prop: {
        width: 200, // start-value - exact value to be determined
        location: 0, // calculated
        middle: 0, // calculated
        gap: 14
      }
      },
    q1: {
      prop: {
        lineThickness_DEFAULT: 2,
        lineThickness_HITBOX: 3,
        lineThickness_SELECT: 4
      }
    },
    q3: {
      prop: {
        lineThickness_DEFAULT: 2,
        lineThickness_HITBOX: 3,
        lineThickness_SELECT: 4

      }
    },
    median: {
      color: {
        running: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999"
          },
        },
        user: {
          line: "#22ff1a",
          highlight: {
            line: "#ffd900",
            detail: {
              line: "#ffd900",
              bg: "#4d4900"
            }
          },
          detail: {
            bg: "#063306",
            line: "#22ff1a",
          },
        },
        faster: {
          line: "#ff0000",
          detail: {
            bg: "#590000",
            line: "#ff0000"
          }
        },
        slower: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
      },
      prop: {
        width: 0,
        lineThickness_DEFAULT: 2,
        lineThickness_SELECT: 3,
        lineThickness_HITBOX: 4,
      }
    },
    mean: {
      color: {
        line: "#ff0000",
        detail: {
          bg: "#590000",
          line: "#ff0000"
        }
      },
      prop: {
        radius_DEFAULT: 4,
        radius_SELECT: 5,
        radius_HITBOX: 5,
      }
    },
    whiskers: {
      color: {
        running: {
          line: "#76b3ff",
          detail: {
            line: "#76b3ff",
            bg: "#293f59"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            line: "#999999",
            bg: "rgb(51,51,51)"
          }
        },
        user: {
          line: "#a6cfff"
        },
      },
      prop: {
        width: 0, // calculated
        lineThickness_DEFAULT: 2,
        lineThickness_HITBOX: 2,
        lineThickness_SELECT: 4
      }
    },
    laps: {
      color: {
        line: "#fffb00",
        detail: {
          line: "#fffb00",
          bg: "#4d4900"
        }
      },
      prop: {
        radius_DEFAULT: 2,
        radius_HITBOX: 2.5,
        radius_SELECT: 2.5
      }
    },
    fliers: {
      color: "rgba(176,176,176)",
      radius: 3.5,
      lineThickness: 0.7
    },
  }
  carclass2 = {
    carclass_id: 0,
    bp: {
      color: {
        running: {
          bg: "rgba(59,37,89,0.2)",
          line: "#AE6BFF",
          detail: {
            bg: "#2b1b40",
            line: "#AE6BFF"
          }
        },
        disc: {
          bg: "rgba(77,77,77,0.4)",
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999",
          }
        },
      },
    },
    median: {
      color: {
        running: {
          line: "#AE6BFF",
          detail: {
            bg: "#2b1b40",
            line: "#AE6BFF"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999"
          },
        },
        user: {
          line: "#AE6BFF",
          highlight: {
            line: "#ffd900",
            detail: {
              line: "#ffd900",
              bg: "#4d4900"
            }
          },
          detail: {
            bg: "#063306",
            line: "#22ff1a",
          },
        },
        faster: {
          line: "#ff0000",
          detail: {
            bg: "#590000",
            line: "#ff0000"
          }
        },
        slower: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
      },
      prop: {
        width: 0,
        lineThickness_DEFAULT: 2,
        lineThickness_SELECT: 3,
        lineThickness_HITBOX: 4,
      }
    },
    mean: {
      color: {
        line: "#ff0000",
        detail: {
          bg: "#590000",
          line: "#ff0000"
        }
      },
      prop: {
        radius_DEFAULT: 4,
        radius_SELECT: 5,
        radius_HITBOX: 5,
      }
    },
    whiskers: {
      color: {
        running: {
          line: "#a087a8",
          detail: {
            line: "#a087a8",
            bg: "#3c3340"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            line: "#999999",
            bg: "rgb(51,51,51)"
          }
        },
      },
    },
    laps: {
      color: {
        line: "#fffb00",
        detail: {
          line: "#fffb00",
          bg: "#4d4900"
        }
      },
    },
    fliers: {
      color: "rgba(176,176,176)",
      radius: 3.5,
      lineThickness: 0.7
    },
  }
  carclass3 = {
    carclass_id: 0,
    bp: {
      color: {
        running: {
          bg: "rgba(89,76,29,0.3)",
          line: "#FFDA59",
          detail: {
            bg: "#403716",
            line: "#FFDA59"
          }
        },
        disc: {
          bg: "rgba(77,77,77,0.4)",
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999",
          }
        },
      },
    },
    median: {
      color: {
        running: {
          line: "#FFDA59",
          detail: {
            bg: "#403716",
            line: "#FFDA59"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999"
          },
        },
        user: {
          line: "#22ff1a",
          highlight: {
            line: "#ffd900",
            detail: {
              line: "#ffd900",
              bg: "#4d4900"
            }
          },
          detail: {
            bg: "#063306",
            line: "#22ff1a",
          },
        },
        faster: {
          line: "#ff0000",
          detail: {
            bg: "#590000",
            line: "#ff0000"
          }
        },
        slower: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
      },
      prop: {
        width: 0,
        lineThickness_DEFAULT: 2,
        lineThickness_SELECT: 3,
        lineThickness_HITBOX: 4,
      }
    },
    mean: {
      color: {
        line: "#ff0000",
        detail: {
          bg: "#590000",
          line: "#ff0000"
        }
      },
      prop: {
        radius_DEFAULT: 4,
        radius_SELECT: 5,
        radius_HITBOX: 5,
      }
    },
    whiskers: {
      color: {
        running: {
          line: "#a3a87e",
          detail: {
            line: "#a3a87e",
            bg: "#3e402f"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            line: "#999999",
            bg: "rgb(51,51,51)"
          }
        },
      },
    },
    laps: {
      color: {
        line: "#fffb00",
        detail: {
          line: "#fffb00",
          bg: "#4d4900"
        }
      },
    },
    fliers: {
      color: "rgba(176,176,176)",
      radius: 3.5,
      lineThickness: 0.7
    }
  }
  carclass4 = {
    carclass_id: 0,
    bp: {
      color: {
        running: {
          bg: "rgba(89,29,47,0.2)",
          line: "#FF5888",
          detail: {
            bg: "#401622",
            line: "#FF5888"
          }
        },
        disc: {
          bg: "rgba(77,77,77,0.4)",
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999",
          }
        },
      },
    },
    median: {
      color: {
        running: {
          line: "#FF5888",
          detail: {
            bg: "#401622",
            line: "#FF5888"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999"
          },
        },
        faster: {
          line: "#ff0000",
          detail: {
            bg: "#590000",
            line: "#ff0000"
          }
        },
        slower: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
      }
    },
    mean: {
      color: {
        line: "#ff0000",
        detail: {
          bg: "#590000",
          line: "#ff0000"
        }
      },
      prop: {
        radius_DEFAULT: 4,
        radius_SELECT: 5,
        radius_HITBOX: 5,
      }
    },
    whiskers: {
      color: {
        running: {
          line: "#b38686",
          detail: {
            line: "#b38686",
            bg: "#403030"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            line: "#999999",
            bg: "rgb(51,51,51)"
          }
        },
      },
    },
    laps: {
      color: {
        line: "#fffb00",
        detail: {
          line: "#fffb00",
          bg: "#4d4900"
        }
      },
    },
    fliers: {
      color: "rgba(176,176,176)",
    },
  }
  carclass5 = {
    carclass_id: 0,
    bp: {
      color: {
        running: {
          bg: "rgba(0,27,59,0.2)",
          line: "#24a8a8",
          detail: {
            bg: "#093059",
            line: "#24a8a8"
          }
        },
        disc: {
          bg: "rgba(77,77,77,0.4)",
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999",
          }
        },
        user: {
          bg: "rgba(166,206,255,0.2)",
          line: "#a6cfff",
          detail: {
            bg: "#d000ff",
            line: "#d000ff"
          }
        },
      },
      prop: {
        width: 200, // start-value - exact value to be determined
        location: 0, // calculated
        middle: 0, // calculated
        gap: 14
      }
    },
    q1: {
      prop: {
        lineThickness_DEFAULT: 2,
        lineThickness_HITBOX: 3,
        lineThickness_SELECT: 4
      }
    },
    q3: {
      prop: {
        lineThickness_DEFAULT: 2,
        lineThickness_HITBOX: 3,
        lineThickness_SELECT: 4

      }
    },
    median: {
      color: {
        running: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            bg: "rgb(51,51,51)",
            line: "#999999"
          },
        },
        user: {
          line: "#22ff1a",
          highlight: {
            line: "#ffd900",
            detail: {
              line: "#ffd900",
              bg: "#4d4900"
            }
          },
          detail: {
            bg: "#063306",
            line: "#22ff1a",
          },
        },
        faster: {
          line: "#ff0000",
          detail: {
            bg: "#590000",
            line: "#ff0000"
          }
        },
        slower: {
          line: "#22ff1a",
          detail: {
            bg: "#063306",
            line: "#22ff1a"
          }
        },
      },
      prop: {
        width: 0,
        lineThickness_DEFAULT: 2,
        lineThickness_SELECT: 3,
        lineThickness_HITBOX: 4,
      }
    },
    mean: {
      color: {
        line: "#ff0000",
        detail: {
          bg: "#590000",
          line: "#ff0000"
        }
      },
      prop: {
        radius_DEFAULT: 4,
        radius_SELECT: 5,
        radius_HITBOX: 5,
      }
    },
    whiskers: {
      color: {
        running: {
          line: "#76b3ff",
          detail: {
            line: "#76b3ff",
            bg: "#293f59"
          }
        },
        disc: {
          line: "#999999",
          detail: {
            line: "#999999",
            bg: "rgb(51,51,51)"
          }
        },
        user: {
          line: "#a6cfff"
        },
      },
      prop: {
        width: 0, // calculated
        lineThickness_DEFAULT: 2,
        lineThickness_HITBOX: 2,
        lineThickness_SELECT: 4
      }
    },
    laps: {
      color: {
        line: "#fffb00",
        detail: {
          line: "#fffb00",
          bg: "#4d4900"
        }
      },
      prop: {
        radius_DEFAULT: 2,
        radius_HITBOX: 2.5,
        radius_SELECT: 2.5
      }
    },
    fliers: {
      color: "rgba(176,176,176)",
      radius: 3.5,
      lineThickness: 0.7
    },
  }

  options: Option_BP = {
    showDiscDisq: {label: "Show disconnected / disqualified drivers", checked: false},
    showIndividualLaps: {label: "Show individual laps", checked: false},
    showMean: {label: "Show mean", checked: false},
    showFasterSlower: {label: "Highlight faster/slower drivers", checked: false},
    showMulticlass: {label: "Show all car classes", checked: true}
  }
}

class DiagramProperties {

  private static _instance: DiagramProperties

  private constructor() {
  }

  static getInstance(): DiagramProperties {
    if (!DiagramProperties._instance) {
      DiagramProperties._instance = new DiagramProperties()
    }
    return DiagramProperties._instance
  }

  yAxis_pos: number = 10
  yAxisTicks_start: number = 0
  yAxisTicks_end: number // calculated
  yAxis_color: string = "white"

  tickLabel_x: number = 41

  fullTick_width: number = 20
  fullTick_color: string = "rgba(255,255,255,0.3)"
  fullTick_spacing: number = 60
  fullTickLabel_fontSize: number = 22
  fullTickLabel_fontColor: string = "#ffffff"

  halfTick_width: number = 12
  halfTick_color: string = "rgba(255,255,255,0.22)"
  halfTickLabel_fontSize: number = 22
  halfTickLabel_fontColor: string = "#cccccc"

  quarterTick_width: number = 8
  quarterTick_color: string = "rgba(255,255,255,0.12)"

  yAxisBgWidth: number = this.yAxis_pos + this.fullTick_width/2

  laptime_detail_dot_gap: number = 20
  laptime_detail_whisker_gap: number = 5
  laptime_detail_q1q3median_gap: number = 5

  driverPositionLabel_y: number = 25
  driverPositionLabel_fontSize: number = 20
  driverPositionLabel_fontColor: string = "#dbdbdb"

  drivernameLabel_y: number = 55
  drivernameLabel_fontSize: number = 20
  drivernameLabel_fontColor: string = "#d9d9d9"


}

class BoxplotElement {

  driver: Driver

  Q3: {
    x: {
      start: number,
      end: number
    }
    y: number
  }

  Q1: {
    x: {
      start: number,
      end: number
    }
    y: number
  }

  median: {
    x: {
      start: number,
      end: number
    }
    y: number
  }

  mean: {
    x: number
    y: number
  }

  whiskers: {
    top: {
      x: {
        start: number
        end: number
      }
      y: number
    }

    bottom: {
      x: {
        start: number
        end: number
      }
      y: number
    }
  }

  fliers: {
    top: Array<Fliers>
    bottom: Array<Fliers>
  }

  laps: Array<Lap>
}

interface Fliers {
  x: number
  y: number
}

interface Lap {
  x: number
  y: number
}

enum DetailType {
  MEDIAN,
  MEAN,
  LAP,
  WHISKER_TOP,
  WHISKER_BOTTOM,
  Q1,
  Q3
}

export interface Option_BP {
  [type: string]: {label: string, checked: boolean}
}







