function parseDate(dateString) {
    return moment(dateString.split('Z')[0]);
}

async function fetchData() {
    const response = await fetch('http://127.0.0.1:3000/api/entries');
    return await response.json();
}

function processData(rawData, startDate) {
    rawData.sort((a, b) => parseDate(a._id) - parseDate(b._id));

    const productionData = [];
    const consumptionData = [];

    rawData.forEach(entry => {
        const baseDate = parseDate(entry._id);
        const isConsumption = entry._id.includes('C');

        entry.observations.forEach(obs => {
            const point = {
                x: baseDate.clone().add((obs.sequence - 1) * 15, 'minutes'),
                y: obs.volume
            };

            if (isConsumption) {
                consumptionData.push(point);
            } else {
                productionData.push(point);
            }
        });
    });

    const filterDate = startDate ? moment(startDate) : moment(0);
    return {
        productionData: productionData.filter(d => d.x >= filterDate),
        consumptionData: consumptionData.filter(d => d.x >= filterDate)
    };
}

function aggregateData(data, interval) {
    const aggregated = [];
    for (let i = 0; i < data.length; i += interval) {
        const chunk = data.slice(i, i + interval);
        const avgVolume = chunk.reduce((sum, obs) => sum + obs.y, 0) / chunk.length;
        aggregated.push({
            x: chunk[0].x,
            y: avgVolume
        });
    }
    return aggregated;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function createChart() {
    const rawData = await fetchData();
    const startDateInput = document.getElementById('startDate');
    let { productionData, consumptionData } = processData(rawData, startDateInput.value);
    const ctx = document.getElementById('myChart').getContext('2d');

    let currentInterval = 1;

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Production Volume',
                    data: productionData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Consumption Volume',
                    data: consumptionData,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        },
        options: {
            spanGaps: 1000 * 60 * 60 * 24 * 2,
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            millisecond: 'HH:mm:ss.SSS',
                            second: 'HH:mm:ss',
                            minute: 'DD MMM HH:mm',
                            hour: 'DD MMM HH:mm',
                            day: 'DD MMM YYYY',
                            week: 'DD MMM YYYY',
                            month: 'MMM YYYY',
                            quarter: 'MMM YYYY',
                            year: 'YYYY'
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxRotation: 0,
                        major: {
                            enabled: true
                        },
                        font: function(context) {
                            if (context.tick && context.tick.major) {
                                return {
                                    weight: 'bold'
                                };
                            }
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume'
                    }
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });

    const updateChartData = debounce((newProductionData, newConsumptionData) => {
        chart.data.datasets[0].data = newProductionData;
        chart.data.datasets[1].data = newConsumptionData;
        chart.update();
    }, 250);

    chart.options.plugins.zoom.zoom.onZoomComplete = function({ chart }) {
        const { min, max } = chart.scales.x;
        const diff = max - min;
        let newInterval = currentInterval;

        if (diff > 1000 * 60 * 60 * 24 * 365) {
            newInterval = 24 * 4 * 30; //month
            chart.options.scales.x.time.unit = 'month';
        } else if (diff > 1000 * 60 * 60 * 24 * 30) {
            newInterval = 24 * 4; //day
            chart.options.scales.x.time.unit = 'day';
        } else if (diff > 1000 * 60 * 60 * 24) {
            newInterval = 4; //hour
            chart.options.scales.x.time.unit = 'hour';
        } else {
            newInterval = 1; //15 minutes
            chart.options.scales.x.time.unit = 'minute';
        }

        if (newInterval !== currentInterval) {
            currentInterval = newInterval;
            const aggregatedProductionData = aggregateData(productionData, newInterval);
            const aggregatedConsumptionData = aggregateData(consumptionData, newInterval);
            updateChartData(aggregatedProductionData, aggregatedConsumptionData);
        } else {
            chart.update();
        }
    };

    startDateInput.addEventListener('change', () => {
        const { productionData: newProductionData, consumptionData: newConsumptionData } = processData(rawData, startDateInput.value);
        productionData = newProductionData;
        consumptionData = newConsumptionData;
        updateChartData(productionData, consumptionData);
    });
}

// Wait for the DOM to be fully loaded before creating the chart
document.addEventListener('DOMContentLoaded', createChart);