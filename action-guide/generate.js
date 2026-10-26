const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const LOTTIE_DIR = path.join(ROOT, 'lottie')
const POSTER_DIR = path.join(ROOT, 'poster')
const WIDTH = 512
const HEIGHT = 420
const FPS = 30
const END_FRAME = 90

fs.mkdirSync(LOTTIE_DIR, { recursive: true })
fs.mkdirSync(POSTER_DIR, { recursive: true })

const COLORS = {
  body: [0.72, 0.75, 0.79, 1],
  bodyLight: [0.83, 0.85, 0.88, 1],
  outline: [0.19, 0.28, 0.38, 1],
  highlight: [0.95, 0.28, 0.13, 1],
  highlightSoft: [0.98, 0.5, 0.3, 0.9],
  equipment: [0.3, 0.38, 0.46, 1],
  equipmentLight: [0.52, 0.59, 0.66, 1],
  bench: [0.43, 0.49, 0.55, 1]
}

function staticValue(value) {
  return { a: 0, k: value }
}

function keyed(values, frames) {
  return {
    a: 1,
    k: values.map((value, index) => ({
      t: frames[index],
      s: Array.isArray(value) ? value : [value],
      e: Array.isArray(values[index + 1])
        ? values[index + 1]
        : (values[index + 1] === undefined ? undefined : [values[index + 1]])
    }))
  }
}

function transform(options) {
  const value = options || {}
  return {
    o: staticValue(value.opacity === undefined ? 100 : value.opacity),
    r: value.rotation || staticValue(0),
    p: value.position || staticValue([0, 0, 0]),
    a: staticValue(value.anchor || [0, 0, 0]),
    s: value.scale || staticValue([100, 100, 100])
  }
}

function group(geometry, fillColor, strokeColor, strokeWidth) {
  const items = [geometry]
  if (fillColor) {
    items.push({
      ty: 'fl',
      c: staticValue(fillColor),
      o: staticValue(100)
    })
  }
  if (strokeColor) {
    items.push({
      ty: 'st',
      c: staticValue(strokeColor),
      o: staticValue(100),
      w: staticValue(strokeWidth || 4),
      lc: 2,
      lj: 2
    })
  }
  items.push({
    ty: 'tr',
    p: staticValue([0, 0]),
    a: staticValue([0, 0]),
    s: staticValue([100, 100]),
    r: staticValue(0),
    o: staticValue(100)
  })
  return { ty: 'gr', it: items }
}

function rect(x, y, width, height, radius, fill, stroke, strokeWidth) {
  return group({
    ty: 'rc',
    p: staticValue([x, y]),
    s: staticValue([width, height]),
    r: staticValue(radius || 0)
  }, fill, stroke, strokeWidth)
}

function ellipse(x, y, width, height, fill, stroke, strokeWidth) {
  return group({
    ty: 'el',
    p: staticValue([x, y]),
    s: staticValue([width, height])
  }, fill, stroke, strokeWidth)
}

function shapeLayer(name, groups, options) {
  const value = options || {}
  return {
    ddd: 0,
    ind: value.index || 1,
    ty: 4,
    nm: name,
    sr: 1,
    ks: transform(value),
    ao: 0,
    shapes: groups
  }
}

function angleMotion(start, middle, end) {
  return keyed([start, middle, end], [0, 45, END_FRAME])
}

function positionMotion(start, middle, end) {
  return keyed(
    [
      [start[0], start[1], 0],
      [middle[0], middle[1], 0],
      [end[0], end[1], 0]
    ],
    [0, 45, END_FRAME]
  )
}

function limbLayer(options) {
  const value = options || {}
  const length = value.length || 108
  const thickness = value.thickness || 20
  const muscleColor = value.highlightColor || null
  const groups = [
    rect(
      length / 2,
      0,
      length,
      thickness,
      thickness / 2,
      COLORS.body,
      COLORS.outline,
      4
    ),
    rect(
      length * 0.38,
      0,
      Math.max(28, length * 0.36),
      thickness * 0.48,
      thickness * 0.24,
      muscleColor
    ),
    ellipse(
      length + 8,
      0,
      thickness * 1.12,
      thickness * 1.12,
      COLORS.bodyLight,
      COLORS.outline,
      3
    )
  ]

  if (value.dumbbell) {
    groups.push(
      ellipse(length + 18, 0, 34, 24, COLORS.equipment, COLORS.outline, 3),
      rect(length + 18, 0, 8, 36, 4, COLORS.equipmentLight, COLORS.outline, 2)
    )
  }

  return shapeLayer(value.name || 'limb', groups, {
    index: value.index,
    position: staticValue([
      value.pivot[0],
      value.pivot[1],
      0
    ]),
    scale: staticValue([
      value.mirror ? -100 : 100,
      100,
      100
    ]),
    rotation: angleMotion(
      value.angles[0],
      value.angles[1],
      value.angles[2]
    )
  })
}

function baseLayers(pattern) {
  const config = PATTERNS[pattern]
  const torsoHighlights = []
  if (config.highlight === 'chest' || config.highlight === 'full') {
    torsoHighlights.push(
      ellipse(230, 164, 44, 28, COLORS.highlight),
      ellipse(282, 164, 44, 28, COLORS.highlight)
    )
  }
  if (config.highlight === 'back') {
    torsoHighlights.push(
      ellipse(230, 154, 38, 30, COLORS.highlight),
      ellipse(282, 154, 38, 30, COLORS.highlight)
    )
  }
  if (config.highlight === 'core') {
    torsoHighlights.push(rect(256, 210, 54, 70, 24, COLORS.highlight))
  }
  if (config.highlight === 'shoulders') {
    torsoHighlights.push(
      ellipse(208, 140, 30, 34, COLORS.highlight),
      ellipse(304, 140, 30, 34, COLORS.highlight)
    )
  }
  if (config.highlight === 'glutes') {
    torsoHighlights.push(ellipse(256, 258, 72, 34, COLORS.highlight))
  }

  const layers = [
    shapeLayer('torso', [
      rect(256, 184, 112, 152, 52, COLORS.body, COLORS.outline, 5),
      ellipse(256, 86, 64, 70, COLORS.bodyLight, COLORS.outline, 5),
      rect(256, 264, 86, 46, 22, COLORS.body, COLORS.outline, 4)
    ], { index: 1 })
  ]
  if (torsoHighlights.length) {
    layers.push(shapeLayer('muscle-highlight', torsoHighlights, { index: 2 }))
  }
  const armHighlight = ['biceps', 'triceps', 'full'].indexOf(config.highlight) > -1
  const legHighlight = ['legs', 'full'].indexOf(config.highlight) > -1
  layers.push(
    limbLayer({
      name: 'left-arm',
      index: 3,
      pivot: [206, 144],
      length: config.armLength || 104,
      angles: config.leftArm || [82, 20, 82],
      mirror: true,
      dumbbell: config.dumbbell,
      highlightColor: armHighlight ? COLORS.highlightSoft : null
    }),
    limbLayer({
      name: 'right-arm',
      index: 4,
      pivot: [306, 144],
      length: config.armLength || 104,
      angles: config.rightArm || [82, 20, 82],
      dumbbell: config.dumbbell,
      highlightColor: armHighlight ? COLORS.highlightSoft : null
    }),
    limbLayer({
      name: 'left-leg',
      index: 5,
      pivot: [232, 276],
      length: 122,
      thickness: 26,
      angles: config.leftLeg || [86, 98, 86],
      mirror: true,
      highlightColor: legHighlight ? COLORS.highlightSoft : null
    }),
    limbLayer({
      name: 'right-leg',
      index: 6,
      pivot: [280, 276],
      length: 122,
      thickness: 26,
      angles: config.rightLeg || [86, 98, 86],
      highlightColor: legHighlight ? COLORS.highlightSoft : null
    })
  )
  return layers
}

function equipmentLayers(pattern) {
  const config = PATTERNS[pattern]
  const layers = []
  if (config.bar) {
    layers.push(shapeLayer('barbell', [
      rect(256, 118, 222, 8, 4, COLORS.equipment, COLORS.outline, 2),
      ellipse(145, 118, 26, 42, COLORS.equipment, COLORS.outline, 3),
      ellipse(367, 118, 26, 42, COLORS.equipment, COLORS.outline, 3)
    ], {
      index: 10,
      position: positionMotion([0, 18], [0, -26], [0, 18])
    }))
  }
  if (config.machine) {
    layers.push(shapeLayer('machine-frame', [
      rect(126, 210, 18, 204, 8, COLORS.equipmentLight),
      rect(386, 210, 18, 204, 8, COLORS.equipmentLight),
      rect(256, 352, 278, 18, 8, COLORS.equipment)
    ], { index: 0 }))
  }
  if (config.bench) {
    layers.push(shapeLayer('bench', [
      rect(260, 288, 292, 24, 10, COLORS.bench, COLORS.outline, 3),
      rect(174, 354, 14, 92, 6, COLORS.equipment),
      rect(346, 354, 14, 92, 6, COLORS.equipment)
    ], { index: 0 }))
  }
  if (config.floor) {
    layers.push(shapeLayer('floor-line', [
      rect(256, 401, 360, 6, 3, COLORS.equipmentLight)
    ], { index: 0 }))
  }
  return layers
}

const PATTERNS = {
  'chest-press': {
    highlight: 'chest',
    leftArm: [112, 22, 112],
    rightArm: [112, 22, 112],
    dumbbell: true,
    bench: true
  },
  'chest-fly': {
    highlight: 'chest',
    leftArm: [88, 18, 88],
    rightArm: [88, 18, 88],
    machine: true
  },
  'vertical-pull': {
    highlight: 'back',
    leftArm: [-58, 52, -58],
    rightArm: [-58, 52, -58],
    machine: true
  },
  'horizontal-pull': {
    highlight: 'back',
    leftArm: [18, 94, 18],
    rightArm: [18, 94, 18],
    machine: true
  },
  'arm-curl': {
    highlight: 'biceps',
    leftArm: [80, 12, 80],
    rightArm: [92, 92, 92],
    dumbbell: true
  },
  triceps: {
    highlight: 'triceps',
    leftArm: [26, 95, 26],
    rightArm: [26, 95, 26],
    dumbbell: true
  },
  'leg-press': {
    highlight: 'legs',
    leftArm: [70, 70, 70],
    rightArm: [70, 70, 70],
    leftLeg: [4, 72, 4],
    rightLeg: [4, 72, 4],
    machine: true
  },
  hinge: {
    highlight: 'legs',
    leftArm: [86, 46, 86],
    rightArm: [86, 46, 86],
    leftLeg: [88, 100, 88],
    rightLeg: [88, 100, 88],
    bar: true,
    floor: true
  },
  'glute-bridge': {
    highlight: 'glutes',
    leftArm: [118, 118, 118],
    rightArm: [118, 118, 118],
    leftLeg: [22, -16, 22],
    rightLeg: [22, -16, 22],
    floor: true
  },
  squat: {
    highlight: 'legs',
    leftArm: [-45, -8, -45],
    rightArm: [-45, -8, -45],
    leftLeg: [42, 92, 42],
    rightLeg: [42, 92, 42],
    floor: true
  },
  lunge: {
    highlight: 'legs',
    leftArm: [82, 82, 82],
    rightArm: [82, 82, 82],
    leftLeg: [38, 74, 38],
    rightLeg: [116, 94, 116],
    floor: true
  },
  core: {
    highlight: 'core',
    leftArm: [112, 62, 112],
    rightArm: [112, 62, 112],
    leftLeg: [58, -2, 58],
    rightLeg: [58, -2, 58],
    floor: true
  },
  'shoulder-press': {
    highlight: 'shoulders',
    leftArm: [-42, -112, -42],
    rightArm: [-42, -112, -42],
    dumbbell: true
  },
  'lateral-raise': {
    highlight: 'shoulders',
    leftArm: [84, -8, 84],
    rightArm: [84, -8, 84],
    dumbbell: true
  },
  'face-pull': {
    highlight: 'back',
    leftArm: [24, -18, 24],
    rightArm: [24, -18, 24],
    machine: true
  },
  cardio: {
    highlight: 'full',
    leftArm: [56, -38, 56],
    rightArm: [104, 42, 104],
    leftLeg: [34, 92, 34],
    rightLeg: [102, 48, 102],
    floor: true
  }
}

function buildLottie(pattern) {
  const layers = []
    .concat(equipmentLayers(pattern))
    .concat(baseLayers(pattern))
    .map((layer, index) => Object.assign({}, layer, { ind: index + 1 }))
  return {
    v: '5.12.2',
    fr: FPS,
    ip: 0,
    op: END_FRAME,
    w: WIDTH,
    h: HEIGHT,
    nm: 'CampusFit Original - ' + pattern,
    ddd: 0,
    assets: [],
    layers
  }
}

function svgArm(pivotX, pivotY, angle, mirror, dumbbell, highlight) {
  const transformValue =
    'translate(' + pivotX + ' ' + pivotY + ') ' +
    'rotate(' + angle + ') ' +
    'scale(' + (mirror ? -1 : 1) + ' 1)'
  return [
    '<g transform="' + transformValue + '">',
    '<rect x="0" y="-10" width="104" height="20" rx="10" fill="#b8bfc8" stroke="#30465d" stroke-width="4"/>',
    highlight
      ? '<rect x="34" y="-5" width="38" height="10" rx="5" fill="#f47b5e" opacity=".9"/>'
      : '',
    '<circle cx="112" cy="0" r="12" fill="#d4d8dd" stroke="#30465d" stroke-width="3"/>',
    dumbbell
      ? '<g><ellipse cx="124" cy="0" rx="16" ry="12" fill="#4c616f" stroke="#30465d" stroke-width="3"/><rect x="120" y="-18" width="8" height="36" rx="4" fill="#8b99a4"/></g>'
      : '',
    '</g>'
  ].join('')
}

function svgLeg(pivotX, pivotY, angle, mirror, highlight) {
  return [
    '<g transform="translate(' + pivotX + ' ' + pivotY + ') ' +
      'rotate(' + angle + ') scale(' + (mirror ? -1 : 1) + ' 1)">',
    '<rect x="0" y="-13" width="122" height="26" rx="13" fill="#b8bfc8" stroke="#30465d" stroke-width="4"/>',
    highlight
      ? '<rect x="44" y="-6" width="48" height="12" rx="6" fill="#f47b5e" opacity=".9"/>'
      : '',
    '<circle cx="130" cy="0" r="13" fill="#d4d8dd" stroke="#30465d" stroke-width="3"/>',
    '</g>'
  ].join('')
}

function buildPoster(pattern) {
  const config = PATTERNS[pattern]
  const midArm = config.rightArm ? config.rightArm[1] : 20
  const midLeg = config.rightLeg ? config.rightLeg[1] : 96
  const armHighlight = ['biceps', 'triceps', 'full'].indexOf(config.highlight) > -1
  const legHighlight = ['legs', 'full'].indexOf(config.highlight) > -1
  const pieces = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="420" viewBox="0 0 512 420">',
    '<rect width="512" height="420" fill="#ffffff"/>',
    '<circle cx="256" cy="210" r="174" fill="#f3f8fd"/>'
  ]

  if (config.machine) {
    pieces.push(
      '<rect x="117" y="96" width="18" height="290" rx="9" fill="#a9b4bf"/>',
      '<rect x="377" y="96" width="18" height="290" rx="9" fill="#a9b4bf"/>',
      '<rect x="126" y="370" width="260" height="16" rx="8" fill="#4d6474"/>'
    )
  }
  if (config.bench) {
    pieces.push(
      '<rect x="110" y="280" width="292" height="24" rx="10" fill="#6f7e89"/>',
      '<rect x="166" y="303" width="14" height="103" rx="6" fill="#4d6474"/>',
      '<rect x="340" y="303" width="14" height="103" rx="6" fill="#4d6474"/>'
    )
  }
  if (config.bar) {
    pieces.push(
      '<rect x="138" y="113" width="236" height="8" rx="4" fill="#4d6474"/>',
      '<ellipse cx="142" cy="117" rx="13" ry="22" fill="#4d6474"/>',
      '<ellipse cx="370" cy="117" rx="13" ry="22" fill="#4d6474"/>'
    )
  }

  pieces.push(
    svgLeg(232, 276, config.leftLeg ? config.leftLeg[1] : midLeg, true, legHighlight),
    svgLeg(280, 276, config.rightLeg ? config.rightLeg[1] : midLeg, false, legHighlight),
    '<rect x="200" y="112" width="112" height="152" rx="52" fill="#b8bfc8" stroke="#30465d" stroke-width="5"/>',
    '<rect x="215" y="246" width="82" height="48" rx="22" fill="#b8bfc8" stroke="#30465d" stroke-width="4"/>',
    '<circle cx="256" cy="84" r="34" fill="#d4d8dd" stroke="#30465d" stroke-width="5"/>',
    config.highlight === 'chest' || config.highlight === 'full'
      ? '<ellipse cx="230" cy="163" rx="22" ry="14" fill="#f15a3c"/><ellipse cx="282" cy="163" rx="22" ry="14" fill="#f15a3c"/>'
      : '',
    config.highlight === 'back'
      ? '<ellipse cx="230" cy="152" rx="19" ry="15" fill="#f15a3c"/><ellipse cx="282" cy="152" rx="19" ry="15" fill="#f15a3c"/>'
      : '',
    config.highlight === 'core'
      ? '<rect x="229" y="175" width="54" height="70" rx="24" fill="#f15a3c"/>'
      : '',
    config.highlight === 'shoulders'
      ? '<ellipse cx="208" cy="139" rx="15" ry="17" fill="#f15a3c"/><ellipse cx="304" cy="139" rx="15" ry="17" fill="#f15a3c"/>'
      : '',
    config.highlight === 'glutes'
      ? '<ellipse cx="256" cy="258" rx="36" ry="17" fill="#f15a3c"/>'
      : '',
    svgArm(206, 144, midArm, true, config.dumbbell, armHighlight),
    svgArm(306, 144, midArm, false, config.dumbbell, armHighlight),
    '<rect x="96" y="401" width="320" height="6" rx="3" fill="#aeb9c3"/>',
    '</svg>'
  )
  return pieces.join('')
}

Object.keys(PATTERNS).forEach((pattern) => {
  fs.writeFileSync(
    path.join(LOTTIE_DIR, pattern + '.json'),
    JSON.stringify(buildLottie(pattern))
  )
  fs.writeFileSync(
    path.join(POSTER_DIR, pattern + '.svg'),
    buildPoster(pattern)
  )
})

fs.writeFileSync(
  path.join(ROOT, 'manifest.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    patterns: Object.keys(PATTERNS),
    anatomy: [
      'anatomy/male_front.png',
      'anatomy/male_back.png',
      'anatomy/female_front.png',
      'anatomy/female_back.png'
    ],
    lottie: Object.keys(PATTERNS).map((name) => 'lottie/' + name + '.json'),
    posterSources: Object.keys(PATTERNS).map((name) => 'poster/' + name + '.svg'),
    posters: Object.keys(PATTERNS).map((name) => 'poster/' + name + '.png')
  }, null, 2)
)

console.log('Generated ' + Object.keys(PATTERNS).length + ' original Lottie and poster pairs.')
