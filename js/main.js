// storage for the loaded lexica
var permaDLex = {}
var permaMLex = {}
var permaTLex = {}
var permaSLex = {}
var prospLex = {}
var affLex = {}
var ageLex = {}
var genderLex = {}
var big5Lex = {}

// keep track of which lexica are loaded into memory
var lexStatus = {
  'dLoaded': false, // is the permaV3_dd lexicon loaded?
  'mLoaded': false, // is the permaV3_manual lexicon loaded?
  'tLoaded': false, // is the permaV3_manual_tsp75 lexicon loaded?
  'sLoaded': false, // is the spanish lexicon loaded?
  'pLoaded': false, // is the prospection lexicon loaded?
  'aLoaded': false, // is the affect lexicon loaded?
  'gLoaded': false, // is the gender lexicon loaded?
  'eLoaded': false, // is the age lexicon loaded?
  '5Loaded': false  // is the big-five lexicon loaded?
}

// cache elements
var body = document.getElementsByTagName('body')[0]
var prospectCheck = document.getElementById('prospectCheck')
var affectCheck = document.getElementById('affectCheck')
var optimismCheck = document.getElementById('optimismCheck')
var bigFiveCheck = document.getElementById('bigFiveCheck')
var ageCheck = document.getElementById('ageCheck')
var genderCheck = document.getElementById('genderCheck')
var minWeight = document.getElementById('minWeight')
var maxWeight = document.getElementById('maxWeight')
var permaSelect = document.getElementById('permaSelect')
var pieChart
var radarChart
var fiveChart
var affChart

/* #################### *
 * Helpers              *
 * #################### */

// get number of times el appears in an array
function indexesOf (arr, el) {
  const idxs = []
  let i = arr.length - 1
  for (i; i >= 0; i--) {
    if (arr[i] === el) {
      idxs.unshift(i)
    }
  }
  return idxs
}

/**
* Generate a CSV URI from an array
* @function makeCSV
* @param {Array} arr array of tokens
*/
function makeCSV (arr) {
  if (document.getElementById('alphaCheck').checked) arr.sort()
  var lineArray = []
  var word
  var i = 0
  var len = arr.length
  for (i; i < len; i++) {
    word = arr[i].replace(/'/g, '^')
    lineArray.push(word)
  }
  var csvContent = lineArray.join('\n')
  return encodeURI('data:text/csv;charset=UTF-16LE,' + csvContent)
}

/* #################### *
 * UI Functions         *
 * #################### */

/**
* Destroy and recreate canvas elements to avoid problems with chart.js
* @function clearCanvases
*/
function clearCanvases () {
  // destroy previous charts.js bits
  if (pieChart != null) pieChart.destroy()
  if (radarChart != null) radarChart.destroy()
  if (fiveChart != null) fiveChart.destroy()
  if (affChart != null) affChart.destroy()
  // remove and repace canvas elements
  var c = document.getElementsByTagName('canvas')
  var len = c.length
  var i = 0
  for (i; i < len; i++) {
    var x = c[i].parentNode
    var canvas = document.createElement('canvas')
    canvas.id = c[i].id
    canvas.width = 400
    canvas.height = 400
    canvas.style.width = '400px'
    canvas.style.height = '400px'
    x.removeChild(c[i])
    x.appendChild(canvas)
  }
}

/**
* Toggles the 'Analyse Optimism' checkbox
* @function optToggle
*/
function optToggle () {
  var optBox = document.getElementById('optBox')
  if (prospectCheck.checked && affectCheck.checked) {
    optimismCheck.disabled = false
    optBox.classList.remove('disabled')
  } else {
    optimismCheck.disabled = true
    optimismCheck.checked = false
    optBox.classList.add('disabled')
  }
}

/* #################### *
 * Main Functions       *
 * #################### */

/**
 * @function getNgrams
 * @param  {Array} arr array of tokens
 * @param  {Number} n number of grams
 * @return {Array} array of n-grams
 */
function getNgrams (arr, n) {
  n -= 1
  const ngrams = []

  const mainLoop = i => {
    const a = []
    let h = 0
    const x = n + 1
    for (h; h < x; h++) {
      a.push(arr[(i + n) + (h - n)])
    }
    return a
  }

  let i = 0
  const len = arr.length - n
  for (i; i < len; i++) {
    ngrams.push(mainLoop(i))
  }

  return ngrams
}

function ngramConvert (arr) {
  const len = arr.length
  const result = []
  let i = 0
  for (i; i < len; i++) {
    result.push(arr[i].join(' '))
  }
  return result
}

/**
* Load JSON files into the relevant lexicon object
* @function loadLexicon
* @param {string} file JSON file name
* @param {Object} obj the global lexicon object
* @param {string} loader relevant lexStatus item e.g. dLoaded
*/
function loadLexicon (file, obj, loader) {
  body.classList.add('loading')

  var request = new XMLHttpRequest()
  request.open('GET', file, true)

  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      var lex = JSON.parse(this.response)
      lexStatus[loader] = true
      var key
      for (key in lex) {
        if (!lex.hasOwnProperty(key)) continue
        obj[key] = lex[key]
      }
      body.classList.remove('loading')
    } else {
      window.alert('There was an error loading the lexicon! Please refresh the page and try again.')
      body.classList.remove('loading')
      // return false
    }
  }

  request.onerror = function () {
    window.alert('There was an error loading the lexicon! Please refresh the page and try again.')
    body.classList.remove('loading')
    // return false
  }

  request.send()
}

/**
* tokenise a string into an array
* @function tokenise
* @param {string} str input string
* @return {Array} an array of tokens
*/
function tokenise (str) {
  // adapted from http://wwbp.org/downloads/public_data/happierfuntokenizing.zip
  var reg = new RegExp(/(?:(?:\+?[01][\-\s.]*)?(?:[\(]?\d{3}[\-\s.\)]*)?\d{3}[\-\s.]*\d{4})|(?:[<>]?[:;=8>][\-o\*\']?[\)\]\(\[dDpPxX\/\:\}\{@\|\\]|[\)\]\(\[dDpPxX\/\:\}\{@\|\\][\-o\*\']?[:;=8<][<>]?|<3|\(?\(?\#?\(?\(?\#?[>\-\^\*\+o\~][\_\.\|oO\,][<\-\^\*\+o\~][\#\;]?\)?\)?)|(?:(?:http[s]?\:\/\/)?(?:[\w\_\-]+\.)+(?:com|net|gov|edu|info|org|ly|be|gl|co|gs|pr|me|cc|us|gd|nl|ws|am|im|fm|kr|to|jp|sg))|(?:http[s]?\:\/\/)|(?:\[[a-z_]+\])|(?:\/\w+\?(?:\;?\w+\=\w+)+)|<[^>]+>|(?:@[\w_]+)|(?:\#+[\w_]+[\w\'_\-]*[\w_]+)|(?:[a-z][a-z'\-_]+[a-z])|(?:[+\-]?\d+[,\/.:-]\d+[+\-]?)|(?:[\w_]+)|(?:\.(?:\s*\.){1,})|(?:\S)/, 'gi') // eslint-disable-line
  return str.match(reg)
}

/**
* @function sortMatches
* @param {Array} arr array to match against lexicon
* @param {Object} obj lexicon object
* @return {Object} object of matches
*/
function sortMatches (arr, obj) {
  var sortedMatches = {'counts': {}}

  // sort out min/max thresholds
  var dd = false // is the lexicon data-driven?
  var min = -999
  var max = 999
  var sel = permaSelect.value
  if (sel === '1' || sel === '4') {
    dd = true
    min = parseFloat(minWeight.value)
    max = parseFloat(maxWeight.value)
  }

  var cat // category
  for (cat in obj) {
    if (!obj.hasOwnProperty(cat)) continue
    var matches = []
    var word // word
    var data = obj[cat]
    var permaCat = (cat.startsWith('POS') || cat.startsWith('NEG'))
    var i = 0
    for (word in data) {
      if (!data.hasOwnProperty(word)) continue
      var weight = data[word]
      if (arr.indexOf(word) > -1) {
        if ((permaCat && dd) && (weight < min || weight > max)) continue
        var match = []
        var reps = indexesOf(arr, word).length
        i += reps
        if (reps > 1) {
          var words = []
          var x
          for (x = 0; x < reps; x++) {
            words.push(word)
          }
          match.push([words, weight])
        } else {
          match.push([word, weight])
        }
        matches.push(match)
      }
    }
    sortedMatches.counts[cat] = i
    sortedMatches[cat] = matches
  }
  return sortedMatches
}

/**
* @function getWords
* @param {Object} obj lexicon matches object
* @param {string} str optional object key to match
* @return {Array} array of words
*/
function getWords (obj, str) {
  var words = []
  var cat
  for (cat in obj) {
    if (!obj.hasOwnProperty(cat)) continue
    if (cat.startsWith(str) && cat !== 'counts') {
      var word
      var data = obj[cat]
      for (word in data) {
        if (!data.hasOwnProperty(word)) continue
        var item = data[word][0][0]
        var len = 0
        if (Array.isArray(item)) {
          len = item.length
          item = data[word][0][0][0]
        }
        if (words.indexOf(item) === -1) {
          if (len === 0) {
            words.push(item)
          } else {
            var i
            for (i = 0; i < len; i++) {
              words.push(item)
            }
          }
        }
      }
    }
  }
  return words
}

/**
* Remove duplicates by appending count to item
* @function handleDuplicates
* @param {Object} obj input object
* @return {Object}
*/
function handleDuplicates (obj) {
  var out = {}
  var cat
  for (cat in obj) {
    if (!obj.hasOwnProperty(cat) || cat === 'counts') continue
    var list = []
    var key
    var data = obj[cat]
    for (key in data) {
      if (!data.hasOwnProperty(key)) continue
      var el = data[key][0][0]
      if (Array.isArray(el)) {
        list.push(el[0] + '[' + el.length + ']')
      } else {
        list.push(el)
      }
    }
    // list.sort()
    out[cat] = list
  }
  return out
}

/**
* Calculate lexical usage from array
* @function calcLex
* @param {Object} obj lexicon matches to add
* @param {number} wc total word count
* @param {number} int intercept value
* @param {string} enc encoding type
* @return {number} the lexical value
*/
function calcLex (obj, wc, int, enc) {
  // error prevention
  if (obj == null) return null
  if (wc != null && typeof wc !== 'number') wc = Number(wc)
  if (int != null && typeof int !== 'number') int = Number(int)
  if (int == null) int = 0

  var lex = 0
  var cat
  for (cat in obj) {
    if (!obj.hasOwnProperty(cat)) continue
    var word = obj[cat][0][0]
    var weight = Number(obj[cat][0][1])
    var count = 1
    if (Array.isArray(word)) count = word.length
    if (enc === 'freq') {
      lex += ((count / wc) * weight)
    } else {
      lex += weight
    }
  }
  lex += int
  return lex
}

function main () {
  // display loading screen
  body.classList.add('loading')

  // get inputted text
  var textarea = document.getElementById('textInput')
  var text = textarea.value.toString().trim().toLowerCase()

  // check that there is actually text there
  if (text.length === 0) {
    body.classList.remove('loading')
    window.alert('Input box is empty!')
    return false
  }

  // remove any existing CSV buttons
  document.getElementById('buttonRow').innerHTML = ''
  document.getElementById('buttonRowBlc').innerHTML = ''

  // clear all the canvas elements
  clearCanvases()

  // create array of individual words
  var tokens = tokenise(text)
  var wordCount = tokens.length

  // make the CSV file if selected
  if (document.getElementById('CSVCheck').checked) {
    var csv = makeCSV(tokens)
    var t = Date.now().toString()
    var btnRow = document.getElementById('buttonRow')
    var btnBlc = document.getElementById('buttonRowBlc')
    var a = document.createElement('a')
    a.setAttribute('href', csv)
    a.setAttribute('download', 'PPTA_Tokens_' + t + '.csv')
    a.classList.add('btn', 'btn-default', 'btn-lg')
    a.innerHTML = 'Save CSV'
    var b = document.createElement('a')
    b.setAttribute('href', csv)
    b.setAttribute('download', 'PPTA_Tokens_' + t + '.csv')
    b.classList.add('btn', 'btn-default', 'btn-block')
    btnRow.appendChild(a)
    btnBlc.appendChild(b)
  }

  // Add ngrams after we do wordCount and CSV
  var ngramSelect = document.getElementById('ngramSelect').value
  var ngrams = []
  if (ngramSelect === '1') {
    ngrams.push(ngramConvert(getNgrams(tokens, 2)))
    ngrams.push(ngramConvert(getNgrams(tokens, 3)))
  } else if (ngramSelect === '2') {
    ngrams.push(ngramConvert(getNgrams(tokens, 2)))
  }
  if (ngramSelect === '1' || ngramSelect === '2') {
    for (let i = 0; i < ngrams.length; i++) {
      tokens = tokens.concat(ngrams[i])
    }
  }

  // generate our match objects
  var PERMA = {}
  var s = permaSelect.value
  if (s === '4') {
    PERMA = sortMatches(tokens, permaSLex)
  } else if (s === '2') {
    PERMA = sortMatches(tokens, permaMLex)
  } else if (s === '3') {
    PERMA = sortMatches(tokens, permaTLex)
  } else {
    PERMA = sortMatches(tokens, permaDLex)
  }

  // calculate our important numbers
  PERMA.counts.POS_T = getWords(PERMA, 'POS').length
  PERMA.counts.NEG_T = getWords(PERMA, 'NEG').length
  PERMA.counts.TOTAL = getWords(PERMA, '').length

  // intercept values
  var permaInt
  if (s === '4') {
    permaInt = {
      POS_P: 2.675173871,
      POS_E: 2.055179283,
      POS_R: 1.977389757,
      POS_M: 1.738298902,
      POS_A: 3.414517804,
      NEG_P: 2.50468297,
      NEG_E: 1.673629622,
      NEG_R: 1.782788984,
      NEG_M: 1.52890284,
      NEG_A: 2.482131179
    }
  } else {
    permaInt = {
      POS_P: 0,
      POS_E: 0,
      POS_R: 0,
      POS_M: 0,
      POS_A: 0,
      NEG_P: 0,
      NEG_E: 0,
      NEG_R: 0,
      NEG_M: 0,
      NEG_A: 0
    }
  }

  // calculate lexical values
  var permaLV = {}
  permaLV.POS_P = calcLex(PERMA.POS_P, wordCount, permaInt.POS_P, 'binary').toFixed(6)
  permaLV.POS_E = calcLex(PERMA.POS_E, wordCount, permaInt.POS_E, 'binary').toFixed(6)
  permaLV.POS_R = calcLex(PERMA.POS_R, wordCount, permaInt.POS_R, 'binary').toFixed(6)
  permaLV.POS_M = calcLex(PERMA.POS_M, wordCount, permaInt.POS_M, 'binary').toFixed(6)
  permaLV.POS_A = calcLex(PERMA.POS_A, wordCount, permaInt.POS_A, 'binary').toFixed(6)
  permaLV.NEG_P = calcLex(PERMA.NEG_P, wordCount, permaInt.NEG_P, 'binary').toFixed(6)
  permaLV.NEG_E = calcLex(PERMA.NEG_E, wordCount, permaInt.NEG_E, 'binary').toFixed(6)
  permaLV.NEG_R = calcLex(PERMA.NEG_R, wordCount, permaInt.NEG_R, 'binary').toFixed(6)
  permaLV.NEG_M = calcLex(PERMA.NEG_M, wordCount, permaInt.NEG_M, 'binary').toFixed(6)
  permaLV.NEG_A = calcLex(PERMA.NEG_A, wordCount, permaInt.NEG_A, 'binary').toFixed(6)

  // create printable array of words/tokens
  var permaPrint = handleDuplicates(PERMA)

  // do the same for prospection
  var PROSP = {}
  var prospLV = {}
  var prospPrint
  if (prospectCheck.checked) {
    PROSP = sortMatches(tokens, prospLex)
    PROSP.counts.TOTAL = getWords(PROSP, '').length
    prospLV.PAST = calcLex(PROSP.PAST, wordCount, (-0.649406376419), 'binary').toFixed(6)
    prospLV.PRESENT = calcLex(PROSP.PRESENT, wordCount, 0.236749577324, 'binary').toFixed(6)
    prospLV.FUTURE = calcLex(PROSP.FUTURE, wordCount, (-0.570547567181), 'binary').toFixed(6)
    prospPrint = handleDuplicates(PROSP)
  }

  // do the same for affect
  var AFF = {}
  var affLV = {}
  var affPrint
  if (affectCheck.checked) {
    AFF = sortMatches(tokens, affLex)
    affLV.AFFECT = calcLex(AFF.AFFECT, wordCount, 5.037104721, 'binary').toFixed(3)
    affLV.INTENSITY = calcLex(AFF.INTENSITY, wordCount, 2.399762631, 'binary').toFixed(3)
    affPrint = handleDuplicates(AFF)

    if (affLV.AFFECT > 9) affLV.AFFECT = 9.000
    if (affLV.INTENSITY > 9) affLV.INTENSITY = 9.000
    if (affLV.AFFECT < 1) affLV.AFFECT = 1.000
    if (affLV.INTENSITY < 1) affLV.INTENSITY = 1.000

    var bubData = {
      datasets: [
        {
          label: 'Affect / Intensity',
          data: [
            {
              x: affLV.AFFECT,
              y: affLV.INTENSITY,
              r: 5
            }
          ],
          backgroundColor: '#FF6384',
          hoverBackgroundColor: '#FF6384'
        }]
    }

    var options = {
      scales: {
        yAxes: [{
          ticks: {
            max: 9,
            min: 1,
            stepSize: 1
          },
          scaleLabel: {
            display: true,
            labelString: 'Intensity'
          }
        }],
        xAxes: [{
          ticks: {
            max: 9,
            min: 1,
            stepSize: 1
          },
          scaleLabel: {
            display: true,
            labelString: 'Affect'
          }
        }]
      }
    }

    var ctx4 = document.getElementById('affBubble').getContext('2d')
    affChart = new Chart(ctx4, {
      type: 'bubble',
      data: bubData,
      options: options
    })
  }

  // do the same for optimism
  var OPT = {}
  var optLV = {}
  var optPrint
  if (optimismCheck.checked) {
    var future = getWords(PROSP, 'FUTURE')
    OPT = sortMatches(future, affLex)
    optLV = calcLex(OPT.AFFECT, wordCount, 5.037104721, 'binary').toFixed(3)
    optPrint = handleDuplicates(OPT)
  }

  // do the same for big five
  var FIVE = {}
  var fiveLV = {}
  var fivePrint
  if (bigFiveCheck.checked) {
    FIVE = sortMatches(tokens, big5Lex)
    FIVE.counts.TOTAL = getWords(FIVE, '').length
    fiveLV.O = calcLex(FIVE.O, wordCount, 0, 'binary').toFixed(6)
    fiveLV.C = calcLex(FIVE.C, wordCount, 0, 'binary').toFixed(6)
    fiveLV.E = calcLex(FIVE.E, wordCount, 0, 'binary').toFixed(6)
    fiveLV.A = calcLex(FIVE.A, wordCount, 0, 'binary').toFixed(6)
    fiveLV.N = calcLex(FIVE.N, wordCount, 0, 'binary').toFixed(6)
    fivePrint = handleDuplicates(FIVE)

    var fiveData = {
      labels: [
        'Openness',
        'Conscientiousness',
        'Extraversion',
        'Agreeableness',
        'Neuroticism'
      ],
      datasets: [
        {
          label: 'Big Five Personality Traits',
          backgroundColor: 'rgba(119, 221, 119,0.2)',
          borderColor: '#77dd77',
          pointBackgroundColor: 'rgba(179,181,198,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#77dd77',
          data: [
            fiveLV.O,
            fiveLV.C,
            fiveLV.E,
            fiveLV.A,
            fiveLV.N
          ]
        },
        {
          label: 'Zero',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: '#000',
          pointBackgroundColor: 'rgba(0,0,0,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#000',
          data: [0, 0, 0, 0, 0]
        }
      ]
    }

    var ctx3 = document.getElementById('fiveRadar').getContext('2d')
    fiveChart = new Chart(ctx3, {
      type: 'radar',
      data: fiveData
    })
  }

  // do the same for age
  var AGE = {}
  var ageLV = {}
  if (ageCheck.checked) {
    AGE = sortMatches(tokens, ageLex)
    ageLV = calcLex(AGE.AGE, wordCount, 23.2188604687, 'freq').toFixed(2)
  }

  // do the same for gender
  var GENDER = {}
  var genderLV = {}
  if (genderCheck.checked) {
    GENDER = sortMatches(tokens, genderLex)
    genderLV = calcLex(GENDER.GENDER, wordCount, (-0.06724152), 'freq').toFixed(3)
  }

  // calculate PERMA percentages
  var neutralWords = (wordCount - PERMA.counts.TOTAL)
  var matchCent = ((PERMA.counts.TOTAL / wordCount) * 100).toFixed(2)
  var neutralCent = ((neutralWords / wordCount) * 100).toFixed(2)

  // make charts
  var ctx1 = document.getElementById('permaPie').getContext('2d')
  var ctx2 = document.getElementById('permaRad').getContext('2d')
  var piedata = {
    labels: [
      'Positive',
      'Negative'
    ],
    datasets: [
      {
        data: [PERMA.counts.POS_T, PERMA.counts.NEG_T],
        backgroundColor: [
          '#77dd77',
          '#FF6384'
        ],
        hoverBackgroundColor: [
          '#77dd77',
          '#FF6384'
        ]
      }]
  }
  var radardata = {
    labels: [
      'Emotion',
      'Engagement',
      'Relationships',
      'Meaning',
      'Accomplishment'
    ],
    datasets: [
      {
        label: 'Positive',
        backgroundColor: 'rgba(119, 221, 119,0.2)',
        borderColor: '#77dd77',
        pointBackgroundColor: 'rgba(179,181,198,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#77dd77',
        data: [
          permaLV.POS_P,
          permaLV.POS_E,
          permaLV.POS_R,
          permaLV.POS_M,
          permaLV.POS_A
        ]
      },
      {
        label: 'Negative',
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        pointBackgroundColor: 'rgba(255,99,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255,99,132,1)',
        data: [
          permaLV.NEG_P,
          permaLV.NEG_E,
          permaLV.NEG_R,
          permaLV.NEG_M,
          permaLV.NEG_A
        ]
      },
      {
        label: 'Zero',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#000',
        pointBackgroundColor: 'rgba(0,0,0,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#000',
        data: [0, 0, 0, 0, 0]
      }
    ]
  }
  pieChart = new Chart(ctx1, {
    type: 'pie',
    data: piedata
  })
  radarChart = new Chart(ctx2, {
    type: 'radar',
    data: radardata
  })

  // calculate ratio
  var PERMARatioStatement = ''
  if (PERMA.counts.POS_T === 0 || PERMA.counts.NEG_T === 0) {
    if (PERMA.counts.POS_T < PERMA.counts.NEG_T) {
      PERMARatioStatement = 'Of the matches, 100% were negative PERMA matches.'
    } else if (PERMA.counts.POS_T > PERMA.counts.NEG_T) {
      PERMARatioStatement = 'Of the matches, 100% were positive PERMA matches.'
    } else if (PERMA.counts.POS_T === PERMA.counts.NEG_T) {
      PERMARatioStatement = 'There were no PERMA matches in the input.'
    }
  } else if (PERMA.counts.POS_T < PERMA.counts.NEG_T) {
    PERMARatioStatement = 'For every positive PERMA match there are ' +
      ((PERMA.counts.NEG_T / PERMA.counts.POS_T).toFixed(3)) +
      ' times as many negative PERMA matches.'
  } else if (PERMA.counts.POS_T > PERMA.counts.NEG_T) {
    PERMARatioStatement = 'For every negative PERMA match there are ' +
      ((PERMA.counts.POS_T / PERMA.counts.NEG_T).toFixed(3)) +
      ' times as many positive PERMA matches.'
  } else if (PERMA.counts.POS_T === PERMA.counts.NEG_T) {
    PERMARatioStatement = 'There are an equal number of + and - PERMA matches.'
  }

  // display results
  // @todo: this is ugly, is there a better way to do this?
  document.getElementById('wordcount').textContent = wordCount
  document.getElementById('matches').textContent = PERMA.counts.TOTAL + ' (' + matchCent + '%)'
  document.getElementById('pmatches').textContent = PERMA.counts.POS_T
  document.getElementById('nmatches').textContent = PERMA.counts.NEG_T
  document.getElementById('umatches').textContent = neutralWords + ' (' + neutralCent + '%)'
  document.getElementById('ratio').textContent = PERMARatioStatement
  if (s === '1' || s === '4') {
    document.getElementById('lex').classList.remove('hidden')
    document.getElementById('ppl').textContent = permaLV.POS_P
    document.getElementById('pel').textContent = permaLV.POS_E
    document.getElementById('prl').textContent = permaLV.POS_R
    document.getElementById('pml').textContent = permaLV.POS_M
    document.getElementById('pal').textContent = permaLV.POS_A
    document.getElementById('npl').textContent = permaLV.NEG_P
    document.getElementById('nel').textContent = permaLV.NEG_E
    document.getElementById('nrl').textContent = permaLV.NEG_R
    document.getElementById('nml').textContent = permaLV.NEG_M
    document.getElementById('nal').textContent = permaLV.NEG_A
    document.getElementById('permaRadar').classList.remove('hidden')
  } else {
    document.getElementById('lex').classList.add('hidden')
    document.getElementById('permaRadar').classList.add('hidden')
  }
  document.getElementById('posP').textContent = permaPrint.POS_P.join(', ')
  document.getElementById('negP').textContent = permaPrint.NEG_P.join(', ')
  document.getElementById('posE').textContent = permaPrint.POS_E.join(', ')
  document.getElementById('negE').textContent = permaPrint.NEG_E.join(', ')
  document.getElementById('posR').textContent = permaPrint.POS_R.join(', ')
  document.getElementById('negR').textContent = permaPrint.NEG_R.join(', ')
  document.getElementById('posM').textContent = permaPrint.POS_M.join(', ')
  document.getElementById('negM').textContent = permaPrint.NEG_M.join(', ')
  document.getElementById('posA').textContent = permaPrint.POS_A.join(', ')
  document.getElementById('negA').textContent = permaPrint.NEG_A.join(', ')
  if (prospectCheck.checked) {
    document.getElementById('prospectRes').classList.remove('hidden')
    document.getElementById('prospTotal').textContent = PROSP.counts.TOTAL
    document.getElementById('prospPast').textContent = PROSP.counts.PAST
    document.getElementById('prospPresent').textContent = PROSP.counts.PRESENT
    document.getElementById('prospFuture').textContent = PROSP.counts.FUTURE
    document.getElementById('pastLex').textContent = prospLV.PAST
    document.getElementById('presLex').textContent = prospLV.PRESENT
    document.getElementById('futrLex').textContent = prospLV.FUTURE
    document.getElementById('past').textContent = prospPrint.PAST.join(', ')
    document.getElementById('present').textContent = prospPrint.PRESENT.join(', ')
    document.getElementById('future').textContent = prospPrint.FUTURE.join(', ')
  }
  if (affectCheck.checked) {
    document.getElementById('affectRes').classList.remove('hidden')
    document.getElementById('affTotal').textContent = AFF.counts.AFFECT
    document.getElementById('affLex').textContent = affLV.AFFECT
    document.getElementById('intLex').textContent = affLV.INTENSITY
    document.getElementById('affPrint').textContent = affPrint.AFFECT.join(', ')
  }
  if (optimismCheck.checked) {
    document.getElementById('optimRes').classList.remove('hidden')
    document.getElementById('optTotal').textContent = OPT.counts.AFFECT
    document.getElementById('optLex').textContent = optLV
    document.getElementById('optPrint').textContent = optPrint.AFFECT.join(', ')
  }
  if (ageCheck.checked) {
    document.getElementById('ageRes').classList.remove('hidden')
    document.getElementById('predAge').textContent = ageLV
  }
  if (genderCheck.checked) {
    document.getElementById('genRes').classList.remove('hidden')
    var g = 'Unknown'
    if (genderLV < 0) {
      g = 'Male'
    } else if (genderLV > 0) {
      g = 'Female'
    }
    document.getElementById('predGen').textContent = g
    document.getElementById('genLex').textContent = genderLV
  }
  if (bigFiveCheck.checked) {
    document.getElementById('fiveRes').classList.remove('hidden')
    document.getElementById('fiveTotal').textContent = FIVE.counts.TOTAL
    document.getElementById('oLex').textContent = fiveLV.O
    document.getElementById('cLex').textContent = fiveLV.C
    document.getElementById('eLex').textContent = fiveLV.E
    document.getElementById('aLex').textContent = fiveLV.A
    document.getElementById('nLex').textContent = fiveLV.N
    document.getElementById('oPrint').textContent = fivePrint.O.join(', ')
    document.getElementById('cPrint').textContent = fivePrint.C.join(', ')
    document.getElementById('ePrint').textContent = fivePrint.E.join(', ')
    document.getElementById('aPrint').textContent = fivePrint.A.join(', ')
    document.getElementById('nPrint').textContent = fivePrint.N.join(', ')
  }

  // remove loading screen
  document.getElementById('noContent').classList.add('hidden')
  document.getElementById('outputSection').classList.remove('hidden')
  document.getElementById('results').classList.add('active')
  document.getElementById('inputSection').classList.remove('active')
  document.getElementById('rTab').classList.add('active')
  document.getElementById('iTab').classList.remove('active')
  body.classList.remove('loading')
  window.scrollTo(0, 0)
}

document.addEventListener('DOMContentLoaded', function loaded () {
  // load initial lexicon
  loadLexicon('json/perma/permaV3_dd.json', permaDLex, 'dLoaded')

  // event listeners
  var startBtns = document.getElementsByClassName('startButton')
  startBtns[0].addEventListener('click', main, false)
  startBtns[1].addEventListener('click', main, false)

  permaSelect.addEventListener('change', function () {
    var i = permaSelect.value
    if (i === '1') {
      if (lexStatus['dLoaded'] === false) {
        loadLexicon('json/perma/permaV3_dd.json', permaDLex, 'dLoaded')
      }
      minWeight.disabled = false
      maxWeight.disabled = false
      minWeight.value = -0.38
      maxWeight.value = 0.86
      minWeight.min = -0.38
      maxWeight.max = 0.86
    } else if (i === '2') {
      if (lexStatus['mLoaded'] === false) {
        loadLexicon('json/perma/permaV3_manual.json', permaMLex, 'mLoaded')
      }
      minWeight.disabled = true
      maxWeight.disabled = true
    } else if (i === '3') {
      if (lexStatus['tLoaded'] === false) {
        loadLexicon('json/perma/permaV3_manual_tsp75.json', permaTLex, 'tLoaded')
      }
      minWeight.disabled = true
      maxWeight.disabled = true
    } else if (i === '4') {
      if (lexStatus['sLoaded'] === false) {
        loadLexicon('json/perma/dd_spermaV3.json', permaSLex, 'sLoaded')
      }
      minWeight.disabled = false
      maxWeight.disabled = false
      minWeight.value = -0.86
      maxWeight.value = 3.35
      minWeight.min = -0.86
      maxWeight.max = 3.35
    } else {
      console.error('#permaSelect: invalid selection. Defaulting to 1.')
      permaSelect.value = '1'
    }
  }, { passive: true })

  prospectCheck.addEventListener('click', function () {
    if (prospectCheck.checked && lexStatus['pLoaded'] === false) {
      loadLexicon('json/prospection/prospection.json', prospLex, 'pLoaded')
    }
    optToggle()
  }, { passive: true })

  affectCheck.addEventListener('click', function () {
    if (affectCheck.checked && lexStatus['aLoaded'] === false) {
      loadLexicon('json/affect/affect.json', affLex, 'aLoaded')
    }
    optToggle()
  }, { passive: true })

  document.getElementById('CSVCheck').addEventListener('click', function () {
    var alphaCSV = document.getElementById('alphaCSV')
    var alphaCSVCheck = document.getElementById('alphaCheck')
    if (alphaCSV.classList.contains('disabled')) {
      alphaCSV.classList.remove('disabled')
      alphaCSVCheck.disabled = false
    } else {
      alphaCSV.classList.add('disabled')
      alphaCSVCheck.disabled = true
    }
  }, { passive: true })

  ageCheck.addEventListener('click', function () {
    if (ageCheck.checked && lexStatus['eLoaded'] === false) {
      loadLexicon('json/age/age.json', ageLex, 'eLoaded')
    }
  }, { passive: true, once: true })

  genderCheck.addEventListener('click', function () {
    if (genderCheck.checked && lexStatus['gLoaded'] === false) {
      loadLexicon('json/gender/gender.json', genderLex, 'gLoaded')
    }
  }, { passive: true, once: true })

  bigFiveCheck.addEventListener('click', function () {
    if (bigFiveCheck.checked && lexStatus['5Loaded'] === false) {
      loadLexicon('json/bigfive/bigfive.json', big5Lex, '5Loaded')
    }
  }, { passive: true, once: true })

  setTimeout(function () {
    // activate popovers
    $('[data-toggle="popover"]').popover()
    $('.collapse').collapse()
  }, 600)

  /*
  * IE10 viewport hack for Surface/desktop Windows 8 bug
  * Copyright 2014-2015 Twitter, Inc.
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
  if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement('style')
    msViewportStyle.appendChild(
      document.createTextNode(
        '@-ms-viewport{width:auto!important}'
      )
    )
    document.querySelector('head').appendChild(msViewportStyle)
  }

  // Chart.js globals
  Chart.defaults.global.responsive = false
  Chart.defaults.global.maintainAspectRatio = false
}, {passive: true, once: true})
