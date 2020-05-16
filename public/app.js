let histData;
let currScope;
let initW;
let windowWidth, windowHeight;

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function stickyMenu(e) {
    // Also update charts
    if (windowWidth != window.innerWidth || windowHeight != window.innerHeight && devicePixelRatio<1.5){
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        showCharts(currScope);
    }
    // When the user scrolls the page, execute myFunction
    window.onscroll = function (e) {
        stickyFunc(e)
    };
    // Get the header
    let header = $('.card-header')[0];
    initW = header.getBoundingClientRect().width;

    if (e) {
        initW = Math.min(e.target.innerWidth - 30 - 15 * (e.target.devicePixelRatio < 1.5), 1110 - 30);
        header.style.width = `${initW}px`;
        // alert(e.target.devicePixelRatio)
    }
    // Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
    function stickyFunc(e) {

        if (window.pageYOffset > 20) {
            header.classList.add("sticky");
            header.style.width = `${initW}px`;
        } else {
            header.classList.remove("sticky");
        }
    }
}


// const chartType = ['Confirmed Cumulative', 'New Confirmed', 'Death Cumulative', 'New Death'];
const colorPresets = {
    'world':{
        US: 0,
        Spain: 1,
        Italy: 2,
        'United Kingdom': 3,
        India: 5,
        Germany: 6,
        France: 7,
        Brazil: 8,
        Russia: 4,
        Mexico: 2,
        Ecuador: 7,
    },

    'us':{
        'New York': 0,
        'New Jersey': 1,
        Massachusetts: 2,
        Illinois:3,
        California:7,
        Pennsylvania:8
    }
}
const createChartConfig = function (x, y, title, colorPresetDefault={}) {

    // const totDays = 30;
    // const dates = x.slice(-totDays);
    const dates = x.slice(1);
    const data = y.map(e => [e[0], e[1].slice(1)]);
    
    const totDays = dates.length;
    let colorPreset = JSON.parse(JSON.stringify(colorPresetDefault));
    const baseOption= {
        timeline: {
            axisType: 'category',
            // realtime: false,
            // loop: false,
            autoPlay: false,
            currentIndex: dates.length - 1,
            playInterval: 1000,
            data: dates,
            symbol: 'none',
        },
        title: {
            text: title,
            left: 'center',
            textStyle: {fontWeight: 'bold'}
        },
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                var colorSpan = color => '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:' + color + '"></span>';
                let rez = params[0].axisValue;
                //console.log(params); //quite useful for debug
                params.filter(e => e.data).forEach(item => {
                    //console.log(item); //quite useful for debug
                    var xx = '</br>'   + colorSpan(item.color) + ' ' + item.seriesName + ': ' + formatNumber(item.data )
                    rez += xx;
                });
        
                return rez;
            }       
        },
        grid: [{
            top: 30,
            bottom: '70px'
        }],
        xAxis: {
            type: 'category',
        },
        yAxis: {
            type: 'value',
            axisLabel: { showMinLabel: false},
            min: 0,
            offset: -25,
            splitLine: {show:false, },
        },
        series: Array(4).fill({ 
            type: 'line',
        })
    }

    const options = dates.map( (v,i) => {
        let seriesData = data.filter(e=>e[1][i]).sort((a, b) => -a[1][i] + b[1][i]).slice(0, 5);
        return {       
            xAxis: {
                data: i==totDays-1?dates:dates.slice(0, -totDays+i+1),
            },
            legend: {
                orient: 'vertical',
                  data: seriesData.map(e => e[0]),
                  textStyle: {
                    fontSize: '1rem',
                  },
                left: '18%',
                top: 40,
            },
            series: seriesData.map((e) => {
                if (! (e[0] in colorPreset)){
                    const currIndices = new Set(Object.values(colorPreset));
                    let i = 0;
                    while (currIndices.has(i) || i%10 == 0) i++;
                    colorPreset[e[0]] = i;
                    // console.log(e[0], i)
                }
                return {
                    // symbol: 'rect',symbolSize : 1,
                    showSymbol: false,
                    name: e[0],
                    data: e[1].slice(0,i+1),
                    type: 'line',
                    color: colorSet[colorPreset[e[0]]%10]
                }
            })
        }
    });

    return {baseOption, options};
}


let showCharts = function (region, data = histData) {

    currScope = region;
    location.hash = '#'+ currScope;
    $(`#${currScope}-tab`).tab('show')

    const key = region == 'world' ? 'global' : 'US';
    let confirmed = Object.entries(data[`confirmed_${key}`].hist);
    let death = Object.entries(data[`deaths_${key}`].hist);
    let dates = data[`confirmed_${key}`].dates.map(e => e.slice(0,-3));

    if (region != 'world'){
        let idx = data[`confirmed_${key}`].dates.findIndex(e => e=='2/29/20');
        dates = dates.slice(idx);
        confimred = confirmed.slice(idx);
        death = death.slice(idx);
    }

    
    const confirmedNew = confirmed.map(e => [e[0], e[1].map((v, i, a) => i ? v - a[i-1] : null)]);
    const deathNew = death.map(e => [e[0], e[1].map((v, i, a) => i ? v - a[i-1] : null)]);


    const config = [
        createChartConfig(dates, confirmed, 'Confirmed Cumulative', colorPresets[region]),
        createChartConfig(dates, confirmedNew, 'Confirmed New', colorPresets[region]),
        createChartConfig(dates, death, 'Death Cumulative', colorPresets[region]),
        createChartConfig(dates, deathNew, 'Death New', colorPresets[region]),
    ];

    const html = config.map((v, i) => {
        return `<div id="chart${i}" class="trendchart"></div>`;
    }).join('');
    document.getElementById('chart_container').innerHTML = html;

    return config.map((cfg, i) => {
        const chart = echarts.init(document.getElementById(`chart${i}`));
        chart.setOption(cfg);
        return chart;
    });

}

async function prepareData() {
    histData = (await axios.get('/history.json')).data;


}


let init = async function () {

    const defaultTab = 'us';
    currScope = location.hash.replace(/^#/, '') || defaultTab;

    await prepareData();
    // showCharts(currScope)

    window.addEventListener('resize', stickyMenu);
    stickyMenu();
}();